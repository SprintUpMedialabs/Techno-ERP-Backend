import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { COLLECTION_NAMES, FeeActions, FeeStatus, FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { Student } from "../models/student";
import { formatResponse } from "../../utils/formatResponse";
import mongoose from "mongoose";
import { objectIdSchema } from "../../validators/commonSchema";
import createHttpError from "http-errors";
import { CreateCollegeTransactionSchema, ICreateCollegeTransactionSchema } from "../validators/collegeTransactionSchema";
import { CollegeTransaction } from "../models/collegeTransactionHistory";
import { EditFeeBreakUpSchema, FetchFeeHistorySchema, IEditFeeBreakUpSchema, IFetchFeeHistorySchema } from "../validators/feeSchema";
import { getCurrentLoggedInUser } from "../../auth/utils/getCurrentLoggedInUser";
import { getCourseYrFromSemNum } from "../../course/utils/getAcaYrFromStartYrSemNum";
import { toRoman } from "../utils/getRomanSemNumber";
import { getCourseYearFromSemNumber } from "../../utils/getCourseYearFromSemNumber";

type FeeDetailInterface = {
    _id: string;
    type: FinanceFeeType;
    schedule: FinanceFeeSchedule;
    actualFee: number;
    finalFee: number;
    paidAmount: number;
    remark: string;
    feeUpdateHistory: {
        updatedAt: Date;
        updatedFee: number;
    }[];
};


export const getStudentDues = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, search, academicYear, courseCode, courseYear } = req.body;

    const filterStage: any = {
        feeStatus: FeeStatus.DUE,
        currentAcademicYear: academicYear,
    };

    if (courseCode) {
        filterStage.courseCode = courseCode;
    }

    if (search?.trim()) {
        filterStage.$and = [
            ...(filterStage.$and ?? []),
            {
                $or: [
                    { 'studentInfo.studentName': { $regex: search, $options: 'i' } },
                    { 'studentInfo.studentId': { $regex: search, $options: 'i' } },
                    { 'studentInfo.studentPhoneNumber': { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    if (courseYear) {
        const year = Number(courseYear);
        const semesters = [(year * 2) - 1, year * 2];

        // If $and already exists, push into it; else create $and
        filterStage.$and = [
            ...(filterStage.$and ?? []),
            {
                $or: [
                    { currentSemester: { $in: semesters } }
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
                courseYear: { $ceil: { $divide: ['$currentSemester', 2] } },
                totalDueAmount: {
                    $sum: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$semester',
                                    as: 'sem',
                                    cond: {
                                        $and: [
                                            { $ne: ['$$sem.fees.dueDate', null] },
                                            { $ifNull: ['$$sem.fees.dueDate', false] }
                                        ]
                                    }
                                }
                            },
                            as: 'filteredSem',
                            in: {
                                $subtract: ['$$filteredSem.fees.totalFinalFee', '$$filteredSem.fees.paidAmount']
                            }
                        }
                    }
                }
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
                extraBalance: 1,
                currentSemester: 1,
                semesterNumber: "$semester.semesterNumber",
                academicYear: "$semester.academicYear",
                finalFee: "$semester.fees.totalFinalFee",
                paidAmount: "$semester.fees.paidAmount",
                dueDate: "$semester.fees.dueDate",
                feeCategory: "$semester.fees.details.type",
                feeSchedule: "$semester.fees.details.schedule",
                feePaid: "$semester.fees.details.paidAmount",
                semesterBreakup: {
                    _id: "$semester.semesterId",
                    id: "$semester.fees.details._id",
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
                currentSemester: { $first: "$currentSemester" },
                extraBalance: { $first: "$extraBalance" },
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
                            semesterId: "$$semBKP._id",
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
                currentSemester: 1,
                HOD: "$departmentInfo.departmentHOD",
                course: "$courseName",
                semesterWiseFeeInformation: 1,
                semesterBreakUp: 1,
                extraBalance: 1,
            }
        }
    ];

    const transactions = await fetchTransactionsByStudentID(studentId);
    const studentInformation = await Student.aggregate(pipeline);
    studentInformation[0].transactionHistory = transactions;
    return formatResponse(res, 200, "Student fee information fetched successfully", true, studentInformation[0]);
});


// FUEX : Here in future, if needed, we can add retry mechanism, not required as of now.
export const recordPayment = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paymentInfo: ICreateCollegeTransactionSchema = req.body;
    const validation = CreateCollegeTransactionSchema.safeParse(paymentInfo);

    if (!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let student = await Student.findById(validation.data.studentId).session(session);
        if (!student) {
            throw createHttpError(404, "Student not found");
        }

        const currentLoggedInUser = getCurrentLoggedInUser(req);

        const transaction = await CollegeTransaction.create([{
            studentId: paymentInfo.studentId.toString(),
            amount: validation.data.amount,
            txnType: validation.data.txnType,
            feeAction: validation.data.feeAction,
            remark: validation.data.remark || "",
            dateTime: new Date(),
            actionedBy: currentLoggedInUser,
            courseCode: student.courseCode,
            courseName: student.courseName,
            courseYear : getCourseYearFromSemNumber(student.currentSemester)
        }], { session });

        const transactionSettlementHistory = [];
        if (validation.data.feeAction === FeeActions.REFUND) {
            if ((student.extraBalance || 0) < validation.data.amount) {
                throw createHttpError(400, "Insufficient extra balance for refund");
            }

            student.extraBalance -= validation.data.amount;
            transactionSettlementHistory.push({
                name: "Refund issued from extra balance",
                amount: validation.data.amount
            });

            const updatedTransaction = await CollegeTransaction.findByIdAndUpdate(
                transaction[0]._id,
                {
                    $set: {
                        transactionSettlementHistory: transactionSettlementHistory
                    }
                },
                {
                    new: true,
                    session
                }
            );

            const finalStudent = await Student.findByIdAndUpdate(
                validation.data.studentId,
                {
                    $set: {
                        extraBalance: student.extraBalance,
                    },
                    $push: {
                        transactionHistory: transaction[0]._id,
                    },
                },
                { new: true, runValidators: true, session }
            );

            await session.commitTransaction();
            session.endSession();

            return formatResponse(res, 200, "Refund processed successfully", true, finalStudent);
        }

        const { student: updatedStudent, remainingBalance, transactionSettlementHistory: tsh } = await settleFees(student, paymentInfo.amount);
        student = updatedStudent;

        const updatedTransaction = await CollegeTransaction.findByIdAndUpdate(
            transaction[0]._id,
            {
                $set: {
                    transactionSettlementHistory: tsh
                }
            },
            {
                new: true,
                session
            }
        );

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


export const settleFees = async (student: any, amount: number) => {
    const transactionSettlementHistory = []
    if (student.feeStatus != FeeStatus.PAID) {
        for (const sem of student.semester) {
            const fees = sem.fees;

            //Below situation might not occur, its added just to increase robustness.
            if (!fees || !fees.details || fees.details.length === 0 || !fees.dueDate)
                continue;

            let totalPaidAmount = fees.paidAmount || 0;
            const totalFinalFees = fees.totalFinalFee || 0;

            //If the semester is already settled, then we have to move to next semester without processing.
            if (totalPaidAmount >= totalFinalFees) {
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
                transactionSettlementHistory.push({
                    name: sem.academicYear + " - " + getCourseYrFromSemNum(sem.semesterNumber) + " Year" + " - " + toRoman(sem.semesterNumber) + " Sem" + " - " + det.type,
                    amount: amountPaid
                })
                det.paidAmount += amountPaid;
                totalPaidAmount += amountPaid;
                amount -= amountPaid;

                //After paying for particular category, if no more amount is left, we will stop.
                if (amount === 0)
                    break;
            }

            fees.paidAmount = totalPaidAmount;

            if (amount === 0)
                break;
        }
    }

    if (amount > 0) {
        //Add to existing extrabalance.
        student.extraBalance = (student.extraBalance || 0) + amount;
        transactionSettlementHistory.push({
            name : "Extra balance amount",
            amount : amount
        });
    }

    const allSemestersSettled = student.semester.every(
        (sem: any) => {
            if (!sem.fees?.dueDate)
                return true;
            return (sem.fees?.paidAmount || 0) >= (sem.fees?.totalFinalFee || 0)
        });

    student.feeStatus = allSemestersSettled ? FeeStatus.PAID : FeeStatus.DUE;

    return {
        student: student,
        remainingBalance: student.extraBalance,
        transactionSettlementHistory: transactionSettlementHistory
    }
};


export const fetchTransactionsByStudentID = async (studentId: any) => {
    const student = await Student.findById(studentId);
    const transactionsId = student?.transactionHistory;

    const transactions = await CollegeTransaction.find({
        _id: { $in: transactionsId }
    }).populate('actionedBy', 'firstName lastName');

    const formattedTransactions = transactions.map(txn => {
        const user = txn.actionedBy as any;
        const formattedActionedBy = user
            ? `${user.firstName} ${user.lastName}`
            : null;

        return {
            ...txn.toObject(),
            actionedBy: formattedActionedBy
        };
    });

    return formattedTransactions;
};


export const fetchFeeUpdatesHistory = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const feeUpdateHistoryData: IFetchFeeHistorySchema = req.body;

    const validation = FetchFeeHistorySchema.safeParse(feeUpdateHistoryData);

    if (validation.error)
        throw createHttpError(400, validation.error.errors[0]);

    let { studentId, semesterId, detailId } = validation.data;

    studentId = new mongoose.Types.ObjectId(studentId);
    semesterId = new mongoose.Types.ObjectId(semesterId);
    detailId = new mongoose.Types.ObjectId(detailId);

    const pipeline = [
        {
            $match: {
                _id: studentId
            }
        },
        {
            $unwind: "$semester"
        },
        {
            $match: {
                "semester.semesterId": semesterId
            }
        },
        {
            $unwind: "$semester.fees.details"
        },
        {
            $match: {
                "semester.fees.details._id": detailId
            }
        },
        { $unwind: "$semester.fees.details.feeUpdateHistory" }, // unwind each fee update
        {
            $lookup: {
                from: "users",
                localField: "semester.fees.details.feeUpdateHistory.updatedBy",
                foreignField: "_id",
                as: "updatedUser"
            }
        },
        {
            $addFields: {
                "semester.fees.details.feeUpdateHistory.updatedBy": {
                    $concat: [
                        { $arrayElemAt: ["$updatedUser.firstName", 0] }, " ",
                        { $arrayElemAt: ["$updatedUser.lastName", 0] }
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$semester.fees.details._id",
                feeUpdateHistory: {
                    $push: "$semester.fees.details.feeUpdateHistory"
                }
            }
        },
        {
            $project: {
                _id: 0,
                feeUpdateHistory: 1
            }
        }
    ];

    const feeHistory = await Student.aggregate(pipeline);

    return formatResponse(res, 200, "Fee Update History fetched successfully.", true, feeHistory[0]);
});

export const editFeeBreakUp = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const editFeeData: IEditFeeBreakUpSchema = req.body;
    const editFeeDataValidation = EditFeeBreakUpSchema.safeParse(editFeeData);

    if (!editFeeDataValidation.success) {
        throw createHttpError(400, editFeeDataValidation.error.errors[0])
    }

    const { studentId, semesterId, detailId, amount: newFinalFee } = editFeeDataValidation.data;

    const student = await Student.findById(studentId);
    if (!student) {
        throw createHttpError(404, "Student not found!")
    }

    const semester = student.semester.find(s => s.semesterId!.toString() === semesterId.toString());
    if (!semester) {
        throw createHttpError(404, "Semester not found!")
    }

    const feeDetail = semester.fees.details.find(d => (d as unknown as FeeDetailInterface)._id?.toString() === detailId.toString());
    if (!feeDetail) {
        throw createHttpError(404, "Details of break up not found")
    }

    const oldFinalFee = feeDetail.finalFee;
    const paidAmount = feeDetail.paidAmount;
    const extraBalance = student.extraBalance;

    const diff = newFinalFee - oldFinalFee;

    feeDetail.feeUpdateHistory.push({
        updatedAt: new Date(),
        extraAmount: diff,
        updatedFee: newFinalFee,
        updatedBy: new mongoose.Types.ObjectId(req.data?.id)
    });

    semester.fees.totalFinalFee += diff;

    if (newFinalFee < oldFinalFee) {
        const overpaid = paidAmount - newFinalFee;
        if (overpaid > 0) {
            feeDetail.paidAmount -= overpaid;
            semester.fees.paidAmount -= overpaid;
            student.extraBalance += overpaid;
        }
    }

    if (newFinalFee > oldFinalFee) {
        const newDue = newFinalFee - paidAmount;

        if (student.extraBalance >= newDue) {
            feeDetail.paidAmount += newDue;
            semester.fees.paidAmount += newDue;
            student.extraBalance -= newDue;
        } else {
            const used = student.extraBalance;
            feeDetail.paidAmount += used;
            semester.fees.paidAmount += used;
            student.extraBalance = 0;
        }
    }

    feeDetail.finalFee = newFinalFee;

    const totalFinal = semester.fees.totalFinalFee;
    const totalPaid = semester.fees.paidAmount;
    const totalDue = totalFinal - totalPaid;

    const allSemestersSettled = student.semester.every(
        (sem: any) => (sem.fees?.paidAmount || 0) >= (sem.fees?.totalFinalFee || 0)
    );
    student.feeStatus = allSemestersSettled ? FeeStatus.PAID : FeeStatus.DUE;

    await student.save();

    return formatResponse(res, 200, "Student fees updated successfully", true, null);
});


export const assignDueDateByCourseAndSemester = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode, semesterNumber } = req.body;
});