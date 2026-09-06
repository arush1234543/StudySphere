import authRouter from "./routes/auth.routes.js";
import express from 'express'; // Fixed typo
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandling } from "./middleware/errorHandling.middleware.js";
import aiRouter from "./routes/ai.routes.js";
import cors from 'cors';

const app = express();

app.use(cors({
    origin: "*",
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use(errorHandling);

export default app;