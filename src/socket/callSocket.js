const {
  startMediasoup,
  createRouter,
  createWebRtcTransport,
  routers,
  producers,
  consumers,
  transports,
  peers,
  getRouter,
} = require('./mediasoupHandler');

function callSocketHandler(io) {
  startMediasoup();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    const roomId = socket.handshake.query.roomId;

    console.log('📞 Call socket connected:', socket.id, 'User:', userId, 'Room:', roomId);

    peers[socket.id] = { socket, userId, roomId };

    // ✅ Create Router if not exists
    if (!routers[roomId]) {
      createRouter(roomId);
    }

    /** 🔥 RTP Capabilities **/
    socket.on('getRtpCapabilities', (callback) => {
      const router = getRouter(roomId);
      callback(router.rtpCapabilities);
    });

    /** 🔥 Create Send Transport **/
    socket.on('createSendTransport', async (callback) => {
      const router = getRouter(roomId);
      const { transport, params } = await createWebRtcTransport(router);
      transports[socket.id] = transport;
      callback(params);
    });

    /** 🔥 Create Receive Transport **/
    socket.on('createRecvTransport', async (callback) => {
      const router = getRouter(roomId);
      const { transport, params } = await createWebRtcTransport(router);
      transports[socket.id + '_recv'] = transport;
      callback(params);
    });

    /** 🔥 Connect Transport **/
    socket.on('connectTransport', async ({ dtlsParameters, isConsumer }, callback) => {
      const transport = isConsumer ? transports[socket.id + '_recv'] : transports[socket.id];
      await transport.connect({ dtlsParameters });
      callback('connected');
    });

    /** 🔥 Produce **/
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

    /** 🔥 Consume **/
    socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
      const router = getRouter(roomId);
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        console.error('❌ Cannot consume');
        return callback({ error: 'Cannot consume' });
      }

      const consumer = await transports[socket.id + '_recv'].consume({
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

    /** 🧹 Cleanup **/
    socket.on('disconnect', () => {
      console.log('❌ Call socket disconnected:', socket.id);

      if (producers[socket.id]) producers[socket.id].close();
      if (consumers[socket.id]) consumers[socket.id].close();
      if (transports[socket.id]) transports[socket.id].close();
      if (transports[socket.id + '_recv']) transports[socket.id + '_recv'].close();

      delete producers[socket.id];
      delete consumers[socket.id];
      delete transports[socket.id];
      delete transports[socket.id + '_recv'];
      delete peers[socket.id];
    });
  });
}

module.exports = { callSocketHandler };
