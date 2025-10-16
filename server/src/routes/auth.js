import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import prisma from "../../prisma/client.js";
import { sendError } from "../utils/http.js";
import {
  authRegisterPayloadSchema,
  authLoginPayloadSchema,
  authTokenResponseSchema,
} from "../../../packages/types/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  let payload;
  try {
    payload = authRegisterPayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "AUTH_VALIDATION_ERROR",
        "Invalid registration payload.",
        { issues: error.issues }
      );
    }
    console.error("[auth.register] parse error", error);
    return sendError(res, 400, "AUTH_VALIDATION_ERROR", "Invalid registration payload.");
  }

  try {
    const hashed = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        password: hashed,
        ...(payload.role ? { role: payload.role } : {}),
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error?.code === "P2002") {
      return sendError(res, 409, "AUTH_EMAIL_CONFLICT", "Email already registered.");
    }
    console.error("[auth.register] error", error);
    return sendError(res, 500, "AUTH_REGISTER_FAILED", "Unable to register user.");
  }
});

router.post("/login", async (req, res) => {
  let payload;
  try {
    payload = authLoginPayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "AUTH_VALIDATION_ERROR",
        "Invalid login payload.",
        { issues: error.issues }
      );
    }
    console.error("[auth.login] parse error", error);
    return sendError(res, 400, "AUTH_VALIDATION_ERROR", "Invalid login payload.");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || !(await bcrypt.compare(payload.password, user.password))) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials.");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[auth.login] Missing JWT_SECRET");
      return sendError(res, 500, "AUTH_CONFIG_MISSING", "Auth configuration is incomplete.");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "1d" });
    const data = authTokenResponseSchema.parse({ token });

    return res.json(data);
  } catch (error) {
    console.error("[auth.login] error", error);
    return sendError(res, 500, "AUTH_LOGIN_FAILED", "Unable to login.");
  }
});

export default router;
