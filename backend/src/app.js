const express=require('express');
const cors=require('cors');
const authRoutes=require("../src/routes/authRoutes");

const app=express();

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use("/api/auth",authRoutes);
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/invites", require("./routes/inviteRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/settlements", require("./routes/settlementRoutes"));
app.use("/api/friends", require("./routes/friendRoutes"));

app.get("/health",(req,res)=>{
    res.json({status:"OK"});
});

module.exports = app;
