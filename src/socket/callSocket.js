const {
  startMediasoup,
  router,
  createWebRtcTransport,
  producers,
  consumers,
  transports,
  peers,
} = require('./mediasoupHandler');

function callSocketHandler(io) {
  startMediasoup();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('📞 Call socket connected:', socket.id, 'User:', userId);

    peers[socket.id] = { socket, userId };

    /** 🔄 Mediasoup Events **/

    socket.on('getRtpCapabilities', (callback) => {
      callback(router.rtpCapabilities);
    });

    socket.on('createTransport', async (callback) => {
      const { transport, params } = await createWebRtcTransport();
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

      // Notify all others
      for (let peerId in peers) {
        if (peerId !== socket.id) {
          peers[peerId].socket.emit('newProducer', {
            producerId: producer.id,
            kind,
          });
        }
      }

      callback({ id: producer.id });
    });

    socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        console.error('❌ Cannot consume');
        return;
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

    /** 📞 Custom Call Signaling **/

    socket.on('startCall', ({ fromUserId, toUserId, isVideo }) => {
      const targetPeer = Object.values(peers).find((p) => p.userId === toUserId);
      if (targetPeer?.socket) {
        console.log(`📞 Calling ${toUserId} from ${fromUserId}`);
        targetPeer.socket.emit('incomingCall', {
          fromUserId,
          isVideo,
        });
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
