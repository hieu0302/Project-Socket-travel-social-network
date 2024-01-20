import { Server } from "socket.io";
import PendingAPI from "./service/PendingNotifyAPI.js";

const io = new Server({
  cors: {
    origin: "https://project-client-travel-social-network.vercel.app/",
    
  },
});

// "http://localhost:5173"

let onlineUsers = [];
let DataPending = [];

const addNewUser = (userId, sockedId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, sockedId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

const createPending = async (data) => {
  console.log("OK", data);
  const newPending = {
    senderName: data.senderName,
    titlePost: data.titlePost,
    idReceiver: data.idReceiver,
    idPost: data.idPost,
    type: data.type,
    pending: data.pending,
    comment: data.comment,
  };
  try {
    await PendingAPI.createPending(newPending);
  } catch (error) {
    console.log(error);
  }
};

io.on("connection", (socket) => {
  socket.on("addNewUser", (userId) => {
    const newUser = onlineUsers.some((user) => user?.userId === userId);
    if (!newUser) {
      onlineUsers.push({
        userId,
        socketId: socket.id,
      });
      const getPending = async () => {
        try {
          const result = await PendingAPI.getPending(userId);
          const dataPending = result.data;
          console.log("KQ", dataPending);
          if (dataPending) {
            DataPending.push({
              dataPending,
            });
            io.to(socket.id).emit("SendPending", {
              dataPending,
            });
            console.log("SOCKET", socket.id);
          }
        } catch (error) {
          console.log(error);
        }
      };
      getPending();
    }

    console.log("userId", onlineUsers);
  });

  socket.on(
    "sendLike",
    ({ senderName, receiverName, idReceiver, idSender, titlePost, idPost }) => {
      const receiver = getUser(idReceiver);
      const dataSendLike = {
        senderName,
        titlePost,
        idReceiver,
        idPost,
        comment: "",
        type: "like",
        pending: false,
      };

      if (receiver) {
        io.to(receiver?.socketId).emit("getNotificationLike", {
          dataSendLike,
        });

        createPending(dataSendLike);
        return;
      }

      createPending(dataSendLike);
    }
  );

  socket.on(
    "sendComment",
    ({
      senderName,
      receiverName,
      idReceiver,
      idSender,
      titlePost,
      idPost,
      comment,
    }) => {
      const receiver = getUser(idReceiver);
      console.log("Heheheh:::", receiver);
      const dataSendComment = {
        senderName,
        titlePost,
        idReceiver,
        idPost,
        comment,
        type: "comment",
        pending: false,
      };
      if (receiver) {
        io.to(receiver?.socketId).emit("getNotifyComment", {
          dataSendComment,
        });
        createPending(dataSendComment);
        return;
      }
      createPending(dataSendComment)
    }
  );

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

io.listen(4000);
