import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import connectToDatabase, { initializeDB } from './config/database';
import logger from './config/logger';
import { validateEnvVariables } from './config/validateEnv';
import { errorHandler } from './middleware/error';
import { apiRouter } from './route';
import { PORT } from './secrets';
import mongoose from 'mongoose';
import { ILeadMasterDocument, LeadMaster } from './crm/models/lead';

const app = express();

let envFile;

if (process.env.NODE_ENV === 'production') {
  envFile = '.env.prod';
} else if (process.env.NODE_ENV === 'uat') {
  envFile = '.env.uat';
} else {
  envFile = '.env';
}

dotenv.config({ path: path.resolve(__dirname, envFile) });


validateEnvVariables();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL] // PROD ENV
    : '*'; // Allow all origins in DEV ENV

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies and Authorization headers, if any.
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

connectToDatabase();
initializeDB();

app.use('/api', apiRouter);
import fs from 'fs';

app.get('/abc', async (req, res) => {
  const leads = await LeadMaster.find({}).lean();
  const backupPath = path.join(__dirname, 'leads_backup.json');

  fs.writeFileSync(backupPath, JSON.stringify(leads, null, 2));
  console.log(`Backup saved to ${backupPath}`);
});

app.get('/upload', async (req, res) => {
  const filePath = path.join(__dirname, 'leads_backup.json');
  const leads: ILeadMasterDocument[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const leadsToInsert: any[] = [];

  for (const lead of leads) {
    const baseData = {
      ...lead,
      // __v: 0, // Optional: reset version
    };

    // If multiple assignedTo users, create a copy per user
    const assignedUsers = Array.isArray(lead.assignedTo) ? lead.assignedTo : [null];

    if (assignedUsers.length > 0) {
      for (const userId of assignedUsers) {
        const newLead = {
          ...baseData,
          assignedTo: userId,
          _id: new mongoose.Types.ObjectId(), // Generate new _id for each
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        };
        leadsToInsert.push(newLead);
      }
    } else {
      // No assignedTo — just insert the original
      const newLead = {
        ...baseData,
        assignedTo: null,
        _id: new mongoose.Types.ObjectId(),
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
      leadsToInsert.push(newLead);
    }
  }

  await LeadMaster.insertMany(leadsToInsert);
  console.log(`Inserted ${leadsToInsert.length} leads.`);
});

app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.use(errorHandler);
app.listen(PORT, () => {
  logger.info(`Started Your Application on Port ${PORT}`);
});
