const {
  startMediasoup,
  createRouter,
  createWebRtcTransport,
  routers,
  producers,
  consumers,
  transports,
  peers,
} = require('./mediasoupHandler');

function callSocketHandler(io) {
  startMediasoup();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    const roomId = socket.handshake.query.roomId; // 🔥 Room ID (use call ID or group)

    console.log('📞 Call socket connected:', socket.id, 'User:', userId, 'Room:', roomId);

    peers[socket.id] = { socket, userId, roomId };

    /** 🔄 Mediasoup **/

    socket.on('getRtpCapabilities', async (callback) => {
      const router = await createRouter(roomId);
      callback(router.rtpCapabilities);
    });

    socket.on('createTransport', async (callback) => {
      const router = await createRouter(roomId);
      const { transport, params } = await createWebRtcTransport(router);

      transports[socket.id] = transport;
      callback(params);
    });

    socket.on('connectTransport', async ({ dtlsParameters }, callback) => {
      await transports[socket.id].connect({ dtlsParameters });
      callback('connected');
    });

    socket.on('produce', async ({ kind, rtpParameters }, callback) => {
      const producer = await transports[socket.id].produce({ kind, rtpParameters });
      producers[socket.id] = producer;

      // Notify others in the same room
      for (let peerId in peers) {
        if (peerId !== socket.id && peers[peerId].roomId === roomId) {
          peers[peerId].socket.emit('newProducer', {
            producerId: producer.id,
            kind,
          });
        }
      }

      callback({ id: producer.id });
    });

    socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
      const router = routers[roomId];
      if (!router) {
        console.error('❌ Router not found for room', roomId);
        return callback({ error: 'Router not ready' });
      }

      if (!router.canConsume({ producerId, rtpCapabilities })) {
        console.error('❌ Cannot consume');
        return callback({ error: 'Cannot consume' });
      }

      const consumer = await transports[socket.id].consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });

      consumers[socket.id] = consumer;

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    });

    /** 📞 Call Signaling **/
    socket.on('startCall', ({ fromUserId, toUserId, isVideo }) => {
      const targetPeer = Object.values(peers).find((p) => p.userId === toUserId);
      if (targetPeer?.socket) {
        targetPeer.socket.emit('incomingCall', { fromUserId, isVideo });
      }
    });

    socket.on('callDeclined', ({ toUserId }) => {
      const targetPeer = Object.values(peers).find((p) => p.userId === toUserId);
      if (targetPeer?.socket) {
        targetPeer.socket.emit('callDeclinedByPeer');
      }
    });

    /** Cleanup **/
    socket.on('disconnect', () => {
      console.log('❌ Call socket disconnected:', socket.id);

      if (producers[socket.id]) producers[socket.id].close();
      if (consumers[socket.id]) consumers[socket.id].close();
      if (transports[socket.id]) transports[socket.id].close();

      delete producers[socket.id];
      delete consumers[socket.id];
      delete transports[socket.id];
      delete peers[socket.id];
    });
  });
}

module.exports = { callSocketHandler };
