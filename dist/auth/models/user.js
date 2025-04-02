"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const commonSchema_1 = require("../../validators/commonSchema");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email should be unique'],
        validate: {
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        }
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters long']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters long']
    },
    //Note: even though, the system is adding the password still validation is required.
    password: {
        type: String,
        validate: {
            validator: function (value) {
                // Only validate if the password is provided
                return !value || value.length >= 6;
            },
            message: 'Password must be at least 6 characters long'
        }
    },
    roles: {
        type: [String],
        enum: {
            values: Object.values(constants_1.UserRoles),
            message: 'Invalid role name'
        },
        default: [constants_1.UserRoles.BASIC_USER]
    }
}, { timestamps: true });
const handleMongooseError = (error, next) => {
    console.log(error);
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error); // Pass any other errors to the next middleware
    }
};
// 🔐 Pre-save middleware to hash password before saving a new user or when password is modified
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next(); // Only hash if password is modified
        try {
            const saltRounds = 10;
            this.password = yield bcrypt_1.default.hash(this.password, saltRounds);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// 🔐 Pre-update middleware to hash password before updating it
userSchema.pre('findOneAndUpdate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const update = this.getUpdate();
        if (update === null || update === void 0 ? void 0 : update.password) {
            try {
                const saltRounds = 10;
                update.password = yield bcrypt_1.default.hash(update.password, saltRounds);
                this.setUpdate(update);
            }
            catch (error) {
                return next(error);
            }
        }
        next();
    });
});
userSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
userSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    delete ret.password;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
userSchema.set('toJSON', { transform: transformDates });
userSchema.set('toObject', { transform: transformDates });
exports.User = mongoose_1.default.model(constants_1.COLLECTION_NAMES.USER, userSchema);
