import mongoose from "mongoose";

const battleVoteSchema = new mongoose.Schema(
  {
    battle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battle",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

// Đảm bảo mỗi user chỉ được vote 1 lần cho mỗi trận battle
battleVoteSchema.index({ battle: 1, user: 1 }, { unique: true });

export default mongoose.model("BattleVote", battleVoteSchema);
