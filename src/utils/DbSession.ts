import mongoose from "mongoose";

export const getDbSession = async () => {
  if (process.env.ENABLE_DB_TRANSACTION) {
    return {
      session: null,
      useTransaction: false,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  return {
    session,
    useTransaction: true,
  };
};
