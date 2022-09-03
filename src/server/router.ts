import express, { Express } from "express";
import { join } from "path";

import { Color, logWithColor } from "./logger";
import { generateUserId } from "./util";

export const initExpressRouter = (app: Express) => {
  app.use(express.static(join(__dirname, "../client/build")));

  app.get("/", (req, res) => {
    res.redirect("/index.html");
  });

  app.get("/index.html", (req, res) => {
    res.sendFile(join(__dirname, "../client/build/main/index.html"));
  });

  app.get("/createRoom", (req, res) => {
    res.redirect("room/" + generateUserId());
  });

  app.get("/room/:room", (req, res) => {
    res.sendFile(join(__dirname, "../client/build/room/room.html"));
  });
};
