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

    if (!routers[roomId]) {
      createRouter(roomId);
    }

    socket.on('getRtpCapabilities', (callback) => {
      const router = getRouter(roomId);
      callback(router.rtpCapabilities);
    });

    socket.on('createSendTransport', async (callback) => {
      const router = getRouter(roomId);
      const { transport, params } = await createWebRtcTransport(router);
      transports[socket.id] = transport;
      callback(params);
    });

    socket.on('createRecvTransport', async (callback) => {
      const router = getRouter(roomId);
      const { transport, params } = await createWebRtcTransport(router);
      transports[socket.id + '_recv'] = transport;
      callback(params);
    });

    socket.on('connectTransport', async ({ dtlsParameters, isConsumer }, callback) => {
      try {
        const transport = isConsumer ? transports[socket.id + '_recv'] : transports[socket.id];
        await transport.connect({ dtlsParameters });
        callback('connected');
      } catch (error) {
        console.error('❌ connectTransport error:', error);
        callback('error');
      }
    });

    socket.on('produce', async ({ kind, rtpParameters }, callback) => {
      try {
        const producer = await transports[socket.id].produce({ kind, rtpParameters });
        producers[socket.id] = producer;

        for (let peerId in peers) {
          if (peerId !== socket.id && peers[peerId].roomId === roomId) {
            peers[peerId].socket.emit('newProducer', {
              producerId: producer.id,
              kind,
            });
          }
        }

        callback({ id: producer.id });
      } catch (err) {
        console.error('❌ produce error:', err);
        callback({ error: err.message });
      }
    });

    socket.on('getProducers', (callback) => {
      const producerIds = [];
      for (let peerId in producers) {
        if (peerId !== socket.id && peers[peerId]?.roomId === roomId) {
          producerIds.push(producers[peerId].id);
        }
      }
      callback(producerIds);
    });

    socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
      try {
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
      } catch (err) {
        console.error('❌ consume error:', err);
        callback({ error: err.message });
      }
    });

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