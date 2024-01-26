import { Server } from "socket.io";
import PendingAPI from "./service/PendingNotifyAPI.js";

const io = new Server({
  cors: {
    origin: "https://project-client-travel-social-network.vercel.app"
    
  },
});

// "http://localhost:5173"
// "https://project-client-travel-social-network.vercel.app"

let  onlineUsers = []
let DataPending = [];

const addNewUser = (userId, sockedId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, sockedId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => onlineUsers.find((user) => user.userId === userId);

const createPending = async (data) => {
  const newPending = {
    senderName: data.senderName,
    titlePost: data.titlePost,
    idReceiver: data.idReceiver,
    idPost: data.idPost,
    type: data.type,
    pending: data.pending,
    comment: data.comment,
    text: data.text,
    idRoomChat: data.idRoomChat

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
          
          if (dataPending) {
            DataPending.push({
              dataPending,
            });
            io.to(socket.id).emit("SendPending", {
              dataPending,
            });
            
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
    "sendMessage",
    ({
      idSender,
      text,
      idRoomChat,
      nameSender,
      idReceiver,
      nameReceiver,
      createdAt,
      avatarSender
    }) => {
      const sendUserSocket = getUser(idReceiver)
      console.log("SEND", sendUserSocket);
      const dataSendMessage = {
        idSender,
        text,
        idRoomChat,
        nameSender,
        idReceiver,
        nameReceiver,
        createdAt,
        avatarSender,
        type: "message",
        pending: false,
      };
      if (sendUserSocket) {
        
       io.to(sendUserSocket.socketId).emit("getMessage", {
          dataSendMessage,
        });
        console.log("RUNNNN.....", dataSendMessage);
        createPending(dataSendMessage);
        return;
      }

      createPending(dataSendMessage);
    }
  );

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
      console.log("Heheheh:::", receiver);
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
      createPending(dataSendComment);
    }
  );



  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

io.listen(8080, () => {
  console.log("Server is listening on port 8080");
});

// https://trip-social-socket.onrender.com
