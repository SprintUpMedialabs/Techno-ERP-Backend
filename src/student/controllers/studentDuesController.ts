import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { FeeStatus } from "../../config/constants";
import { Student } from "../models/student";
import { formatResponse } from "../../utils/formatResponse";
import mongoose from "mongoose";
import { objectIdSchema } from "../../validators/commonSchema";
import createHttpError from "http-errors";
import { CreateCollegeTransactionSchema, ICreateCollegeTransactionSchema } from "../validators/collegeTransactionSchema";
import { CollegeTransaction } from "../models/collegeTransactionHistory";

export const getStudentDues = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, search, academicYear } = req.body;

    const filterStage: any = {
        feeStatus: FeeStatus.DUE,
        currentAcademicYear: academicYear
    };

    if (search?.trim()) {
        filterStage.$and = [
            ...(filterStage.$and ?? []),
            {
                $or: [
                    { 'studentInfo.studentName': { $regex: search, $options: 'i' } },
                    { 'studentInfo.studentId': { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }

    const studentAggregation = Student.aggregate([
        { $match: filterStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
            $project: {
                feeStatus: 1,
                courseName: 1,
                universityId: '$studentInfo.universityId',
                studentName: '$studentInfo.studentName',
                studentPhoneNumber: '$studentInfo.studentPhoneNumber',
                fatherName: '$studentInfo.fatherName',
                fatherPhoneNumber: '$studentInfo.fatherPhoneNumber',
                currentSemester: 1,
                courseYear: { $ceil: { $divide: ['$currentSemester', 2] } }
            }
        }
    ]);

    const countQuery = Student.countDocuments(filterStage);

    const [students, totalCount] = await Promise.all([
        studentAggregation,
        countQuery
    ]);

    return formatResponse(res, 200, "Student with Due Fees fetched successfully", true, {
        data: students,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    })
});

export const fetchFeeInformationByStudentId = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const studentId = new mongoose.Types.ObjectId(id);

    const validation = objectIdSchema.safeParse(studentId);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0].message);
    }

    const pipeline = [
        { $match: { _id: studentId } },
        {
            $lookup: {
                from: "departmentmetadatas",
                localField: "departmentMetaDataId",
                foreignField: "_id",
                as: "departmentInfo"
            }
        },
        { $unwind: "$departmentInfo" },
        { $unwind: "$semester" },
        {
            $project: {
                studentInfo: 1,
                courseName: 1,
                feeStatus: 1,
                departmentInfo: 1,
                semesterNumber: "$semester.semesterNumber",
                academicYear: "$semester.academicYear",
                finalFee: "$semester.fees.totalFinalFee",
                paidAmount: "$semester.fees.paidAmount",
                dueDate: "$semester.fees.dueDate",
                feeCategory: "$semester.fees.details.type",
                feeSchedule: "$semester.fees.details.schedule",
                feePaid: "$semester.fees.details.paidAmount",
                semesterBreakup: {
                    id : "$semester.fees.details._id",
                    semesterNumber: "$semester.semesterNumber",
                    feeCategory: "$semester.fees.details.type",
                    feeSchedule: "$semester.fees.details.schedule",
                    finalFee: "$semester.fees.details.finalFee",
                    paidAmount: "$semester.fees.details.paidAmount"
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                studentInfo: { $first: "$studentInfo" },
                courseName: { $first: "$courseName" },
                feeStatus: { $first: "$feeStatus" },
                departmentInfo: { $first: "$departmentInfo" },
                semesterWiseFeeInformation: {
                    $push: {
                        semesterNumber: "$semesterNumber",
                        academicYear: "$academicYear",
                        finalFee: "$finalFee",
                        paidAmount: "$paidAmount",
                        dueDate: "$dueDate"
                    }
                },
                semesterBreakUp: { $push: "$semesterBreakup" }
            }
        },
        {
            $addFields: {
                semesterWiseFeeInformation: {
                    $map: {
                        input: "$semesterWiseFeeInformation",
                        as: "semesterInfo",
                        in: {
                            semesterNumber: "$$semesterInfo.semesterNumber",
                            academicYear: "$$semesterInfo.academicYear",
                            finalFee: "$$semesterInfo.finalFee",
                            paidAmount: "$$semesterInfo.paidAmount",
                            dueDate: "$$semesterInfo.dueDate"
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                semesterBreakUp: {
                    $map: {
                        input: "$semesterBreakUp",
                        as: "semBKP",
                        in: {
                            semesterNumber: "$$semBKP.semesterNumber",
                            details: {
                                $map: {
                                    input: "$$semBKP.feeCategory",
                                    as: "feeCategory",
                                    in: {
                                        feeCategory: "$$feeCategory",
                                        feeDetailId: {
                                            $arrayElemAt: [
                                              "$$semBKP.id",
                                              { $indexOfArray: ["$$semBKP.feeCategory", "$$feeCategory"] }
                                            ]
                                          },
                                        feeSchedule: {
                                            $arrayElemAt: [
                                                "$$semBKP.feeSchedule",
                                                { $indexOfArray: ["$$semBKP.feeCategory", "$$feeCategory"] }
                                            ]
                                        },
                                        finalFee: {
                                            $arrayElemAt: [
                                                "$$semBKP.finalFee",
                                                { $indexOfArray: ["$$semBKP.feeCategory", "$$feeCategory"] }
                                            ]
                                        },
                                        paidAmount: {
                                            $arrayElemAt: [
                                                "$$semBKP.paidAmount",
                                                { $indexOfArray: ["$$semBKP.feeCategory", "$$feeCategory"] }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                studentName: "$studentInfo.studentName",
                studentID: "$studentInfo.universityId",
                fatherName: "$studentInfo.fatherName",
                feeStatus: 1,
                HOD: "$departmentInfo.departmentHOD",
                course: "$courseName",
                semesterWiseFeeInformation: 1,
                semesterBreakUp: 1,
            }
        }
    ];

    const transactions = await fetchTransactionsByStudentID(studentId);
    const studentInformation = await Student.aggregate(pipeline);
    // console.log(studentInformation[0]);
    studentInformation[0].transactionHistory = transactions;
    return formatResponse(res, 200, "Student fee information fetched successfully", true, studentInformation[0]);
});

// FUEX : Here in future, if needed, we can add retry mechanism, not required as of now.
export const recordPayment = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paymentInfo: ICreateCollegeTransactionSchema = req.body;

    // console.log("Payment Info is : ", paymentInfo);

    const validation = CreateCollegeTransactionSchema.safeParse(paymentInfo);

    // console.log("Payment Info validation error is : ", validation.error);
    if (!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let student = await Student.findById(validation.data.studentId).session(session);
        // console.log("Student is : ", student);
        if (!student) {
            throw createHttpError(404, "Student not found");
        }

        const transaction = await CollegeTransaction.create([{
            studentId: paymentInfo.studentId.toString(),
            amount: validation.data.amount,
            txnType: validation.data.txnType,
            feeAction: validation.data.feeAction,
            remark: validation.data.remark || "",
            dateTime: new Date(),
            actionedBy : validation.data.actionedBy
        }], { session });

        // console.log("Transaction created : ", transaction);
        // console.log(transaction[0]._id);

        const { student: updatedStudent, remainingBalance } = settleFees(student, paymentInfo.amount);
        student = updatedStudent;

        // console.log("Updated student is  : ", updatedStudent);

        const finalStudent = await Student.findByIdAndUpdate(
            validation.data.studentId,
            {
                $set: {
                    semester: updatedStudent.semester,
                    extraBalance: updatedStudent.extraBalance,
                    feeStatus: updatedStudent.feeStatus,
                },
                $push: {
                    transactionHistory: transaction[0]._id,
                },
            },
            { new: true, runValidators: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        return formatResponse(res, 200, "Payment settled successfully", true, finalStudent);

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
});

export const settleFees = (student: any, amount: number) => {

    if (student.feeStatus != FeeStatus.PAID) {
        console.log("Karu chu settle bhai!")
        for (const sem of student.semester) {
            const fees = sem.fees;

            //Below situation might not occur, its added just to increase robustness.
            if (!fees || !fees.details || fees.details.length === 0 || !fees.dueDate)
                continue;            

            let totalPaidAmount = fees.paidAmount || 0;
            const totalFinalFees = fees.totalFinalFee || 0;

            //If the semester is already settled, then we have to move to next semester without processing.
            if (totalPaidAmount >= totalFinalFees) {
                console.log(`Semester ${sem.semesterNumber} already settled.`);
                continue;
            }

            for (const det of fees.details) {
                const { finalFee, paidAmount } = det;

                //If fee for particular category is already settled in particular semester, move to next.
                // Ex : HOSTEL FEE and EXAM FEE is settled, rest are to be settled, directly process the next.
                if (paidAmount >= finalFee)
                    continue;

                const remainingFee = finalFee - paidAmount;

                //Below we take minimum, because it can happen that amountToBePaid is more but the amount deposited is less.
                const amountPaid = Math.min(remainingFee, amount);
                det.paidAmount += amountPaid;
                totalPaidAmount += amountPaid;
                amount -= amountPaid;

                // console.log(`Paid ₹${amountPaid} for '${det.type}' in Semester ${sem.semesterNumber}. Remaining amount: ₹${amount}`);

                //After paying for particular category, if no more amount is left, we will stop.
                if (amount === 0)
                    break;
            }

            fees.paidAmount = totalPaidAmount;
            // console.log(`Updated paid amount for Semester ${sem.semesterNumber}: ₹${totalPaidAmount}`);

            if (amount === 0)
                break;
        }
    }

    console.log("Control is here");
    if (amount > 0) {
        //Add to existing extrabalance.
        student.extraBalance = (student.extraBalance || 0) + amount;
        // console.log(`Extra amount ₹${amount} added to student's extra balance.`);
    }

    const allSemestersSettled = student.semester.every(
        (sem: any) => (sem.fees?.paidAmount || 0) >= (sem.fees?.totalFinalFee || 0)
    );
    student.feeStatus = allSemestersSettled ? FeeStatus.PAID : FeeStatus.DUE;

    console.log("Final Fee Status:", student.feeStatus);

    return {
        student: student,
        remainingBalance: student.extraBalance
    }
};

export const fetchTransactionsByStudentID = async (studentId: any) => {
    const student = await Student.findById(studentId);
    const transactionsId = student?.transactionHistory;

    const transactions = await CollegeTransaction.find({
        _id: { $in: transactionsId }
    }).populate('actionedBy', 'firstName lastName email'); 

    const formattedTransactions = transactions.map(txn => {
        const user = txn.actionedBy as any; 
        const formattedActionedBy = user
            ? `${user.firstName} ${user.lastName} - ${user.email}`
            : null;

        return {
            ...txn.toObject(), 
            actionedBy: formattedActionedBy
        };
    });

    return formattedTransactions;
};
