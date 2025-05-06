"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editFeeBreakUp = exports.fetchFeeUpdatesHistory = exports.fetchTransactionsByStudentID = exports.settleFees = exports.recordPayment = exports.fetchFeeInformationByStudentId = exports.getStudentDues = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const student_1 = require("../models/student");
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = __importDefault(require("mongoose"));
const commonSchema_1 = require("../../validators/commonSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const collegeTransactionSchema_1 = require("../validators/collegeTransactionSchema");
const collegeTransactionHistory_1 = require("../models/collegeTransactionHistory");
const feeSchema_1 = require("../validators/feeSchema");
exports.getStudentDues = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page, limit, search, academicYear } = req.body;
    const filterStage = {
        feeStatus: constants_1.FeeStatus.DUE,
        currentAcademicYear: academicYear
    };
    if (search === null || search === void 0 ? void 0 : search.trim()) {
        filterStage.$and = [
            ...((_a = filterStage.$and) !== null && _a !== void 0 ? _a : []),
            {
                $or: [
                    { 'studentInfo.studentName': { $regex: search, $options: 'i' } },
                    { 'studentInfo.studentId': { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    const studentAggregation = student_1.Student.aggregate([
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
    const countQuery = student_1.Student.countDocuments(filterStage);
    const [students, totalCount] = yield Promise.all([
        studentAggregation,
        countQuery
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, "Student with Due Fees fetched successfully", true, {
        data: students,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    });
}));
exports.fetchFeeInformationByStudentId = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const studentId = new mongoose_1.default.Types.ObjectId(id);
    const validation = commonSchema_1.objectIdSchema.safeParse(studentId);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0].message);
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
                HOD: "$departmentInfo.departmentHOD",
                course: "$courseName",
                semesterWiseFeeInformation: 1,
                semesterBreakUp: 1,
            }
        }
    ];
    const transactions = yield (0, exports.fetchTransactionsByStudentID)(studentId);
    const studentInformation = yield student_1.Student.aggregate(pipeline);
    // console.log(studentInformation[0]);
    studentInformation[0].transactionHistory = transactions;
    return (0, formatResponse_1.formatResponse)(res, 200, "Student fee information fetched successfully", true, studentInformation[0]);
}));
// FUEX : Here in future, if needed, we can add retry mechanism, not required as of now.
exports.recordPayment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentInfo = req.body;
    // console.log("Payment Info is : ", paymentInfo);
    const validation = collegeTransactionSchema_1.CreateCollegeTransactionSchema.safeParse(paymentInfo);
    // console.log("Payment Info validation error is : ", validation.error);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        let student = yield student_1.Student.findById(validation.data.studentId).session(session);
        // console.log("Student is : ", student);
        if (!student) {
            throw (0, http_errors_1.default)(404, "Student not found");
        }
        const transaction = yield collegeTransactionHistory_1.CollegeTransaction.create([{
                studentId: paymentInfo.studentId.toString(),
                amount: validation.data.amount,
                txnType: validation.data.txnType,
                feeAction: validation.data.feeAction,
                remark: validation.data.remark || "",
                dateTime: new Date(),
                actionedBy: validation.data.actionedBy
            }], { session });
        // console.log("Transaction created : ", transaction);
        // console.log(transaction[0]._id);
        if (validation.data.feeAction === constants_1.FeeActions.REFUND) {
            if ((student.extraBalance || 0) < validation.data.amount) {
                throw (0, http_errors_1.default)(400, "Insufficient extra balance for refund");
            }
            student.extraBalance -= validation.data.amount;
            const finalStudent = yield student_1.Student.findByIdAndUpdate(validation.data.studentId, {
                $set: {
                    extraBalance: student.extraBalance,
                },
                $push: {
                    transactionHistory: transaction[0]._id,
                },
            }, { new: true, runValidators: true, session });
            yield session.commitTransaction();
            session.endSession();
            return (0, formatResponse_1.formatResponse)(res, 200, "Refund processed successfully", true, finalStudent);
        }
        const { student: updatedStudent, remainingBalance } = (0, exports.settleFees)(student, paymentInfo.amount);
        student = updatedStudent;
        // console.log("Updated student is  : ", updatedStudent);
        const finalStudent = yield student_1.Student.findByIdAndUpdate(validation.data.studentId, {
            $set: {
                semester: updatedStudent.semester,
                extraBalance: updatedStudent.extraBalance,
                feeStatus: updatedStudent.feeStatus,
            },
            $push: {
                transactionHistory: transaction[0]._id,
            },
        }, { new: true, runValidators: true, session });
        yield session.commitTransaction();
        session.endSession();
        return (0, formatResponse_1.formatResponse)(res, 200, "Payment settled successfully", true, finalStudent);
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
}));
const settleFees = (student, amount) => {
    if (student.feeStatus != constants_1.FeeStatus.PAID) {
        console.log("Karu chu settle bhai!");
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
    const allSemestersSettled = student.semester.every((sem) => { var _a, _b; return (((_a = sem.fees) === null || _a === void 0 ? void 0 : _a.paidAmount) || 0) >= (((_b = sem.fees) === null || _b === void 0 ? void 0 : _b.totalFinalFee) || 0); });
    student.feeStatus = allSemestersSettled ? constants_1.FeeStatus.PAID : constants_1.FeeStatus.DUE;
    console.log("Final Fee Status:", student.feeStatus);
    return {
        student: student,
        remainingBalance: student.extraBalance
    };
};
exports.settleFees = settleFees;
const fetchTransactionsByStudentID = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_1.Student.findById(studentId);
    const transactionsId = student === null || student === void 0 ? void 0 : student.transactionHistory;
    const transactions = yield collegeTransactionHistory_1.CollegeTransaction.find({
        _id: { $in: transactionsId }
    }).populate('actionedBy', 'firstName lastName email');
    const formattedTransactions = transactions.map(txn => {
        const user = txn.actionedBy;
        const formattedActionedBy = user
            ? `${user.firstName} ${user.lastName} - ${user.email}`
            : null;
        return Object.assign(Object.assign({}, txn.toObject()), { actionedBy: formattedActionedBy });
    });
    return formattedTransactions;
});
exports.fetchTransactionsByStudentID = fetchTransactionsByStudentID;
exports.fetchFeeUpdatesHistory = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const feeUpdateHistoryData = req.body;
    const validation = feeSchema_1.FetchFeeHistorySchema.safeParse(feeUpdateHistoryData);
    if (validation.error)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { studentId, semesterId, detailId } = validation.data;
    studentId = new mongoose_1.default.Types.ObjectId(studentId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    detailId = new mongoose_1.default.Types.ObjectId(detailId);
    console.log("Student ID is : ", studentId);
    console.log("Semester ID is : ", semesterId);
    console.log("Detail ID is : ", detailId);
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
        {
            $project: {
                _id: 0,
                feeUpdateHistory: "$semester.fees.details.feeUpdateHistory"
            }
        }
    ];
    const feeHistory = yield student_1.Student.aggregate(pipeline);
    console.log("Fee history is : ", feeHistory[0]);
    return (0, formatResponse_1.formatResponse)(res, 200, "Fee Update History fetched successfully.", true, feeHistory[0]);
}));
exports.editFeeBreakUp = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const editFeeData = req.body;
    const editFeeDataValidation = feeSchema_1.EditFeeBreakUpSchema.safeParse(editFeeData);
    if (!editFeeDataValidation.success) {
        throw (0, http_errors_1.default)(400, editFeeDataValidation.error.errors[0]);
    }
    const { studentId, semesterId, detailId, amount: newFinalFee } = editFeeDataValidation.data;
    const student = yield student_1.Student.findById(studentId);
    if (!student) {
        throw (0, http_errors_1.default)(404, "Student not found!");
    }
    const semester = student.semester.find(s => s.semesterId.toString() === semesterId.toString());
    if (!semester) {
        throw (0, http_errors_1.default)(404, "Semester not found!");
    }
    const feeDetail = semester.fees.details.find(d => { var _a; return ((_a = d._id) === null || _a === void 0 ? void 0 : _a.toString()) === detailId.toString(); });
    if (!feeDetail) {
        throw (0, http_errors_1.default)(404, "Details of break up not found");
    }
    const oldFinalFee = feeDetail.finalFee;
    const paidAmount = feeDetail.paidAmount;
    const extraBalance = student.extraBalance;
    const diff = newFinalFee - oldFinalFee;
    feeDetail.feeUpdateHistory.push({
        updatedAt: new Date(),
        updatedFee: newFinalFee,
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
        }
        else {
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
    const allSemestersSettled = student.semester.every((sem) => { var _a, _b; return (((_a = sem.fees) === null || _a === void 0 ? void 0 : _a.paidAmount) || 0) >= (((_b = sem.fees) === null || _b === void 0 ? void 0 : _b.totalFinalFee) || 0); });
    student.feeStatus = allSemestersSettled ? constants_1.FeeStatus.PAID : constants_1.FeeStatus.DUE;
    yield student.save();
    console.log(student.semester);
    return (0, formatResponse_1.formatResponse)(res, 200, "Student fees updated successfully", true, null);
}));
