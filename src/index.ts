import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorMiddleware, notFoundMiddleware, } from "./inbound/middlewares/error.middleware.js";
import { bootstrap } from "./bootstrap.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { CORS_OPTIONS, MORGAN_FORMAT, PORT, RATE_LIMIT_OPTIONS } from "./shared/config.js";

const { authRouter, userRouter, sajuRouter, orderRouter, reportRouter } = bootstrap();

const app = express();

app.use(cors(CORS_OPTIONS));
app.use(cookieParser());
app.use(express.json());
app.use(morgan(MORGAN_FORMAT));
app.use(helmet());
app.use(rateLimit(RATE_LIMIT_OPTIONS));
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/saju", sajuRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reports", reportRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`서버 포트: ${PORT}`);
});
