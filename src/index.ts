import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./inbound/middlewares/error.middleware.js";
import { bootstrap } from "./bootstrap.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const { authRouter, userRouter, sajuRouter } = bootstrap();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: "너무 많은 요청이 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
  }),
);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/saju", sajuRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`서버 포트: ${process.env.PORT}`);
});
