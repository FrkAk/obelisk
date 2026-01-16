import { router } from "@/lib/trpc/init";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { remarkRouter } from "./remark";
import { poiRouter } from "./poi";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  remark: remarkRouter,
  poi: poiRouter,
});

export type AppRouter = typeof appRouter;
