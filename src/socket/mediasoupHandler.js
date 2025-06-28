const mediasoup = require('mediasoup');

let worker;
let router;
const transports = {}; // Stores all transports by socket.id
const producers = {};  // Stores all producers by socket.id
const consumers = {};  // Stores all consumers by socket.id
const peers = {};      // Stores peers with socket and userId

/**
 * ✅ Start Mediasoup Worker and Router
 */
async function startMediasoup() {
  // Create Worker
  worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });

  worker.on('died', () => {
    console.error('❌ Mediasoup worker has died');
    process.exit(1);
  });

  // Create Router
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {},
      },
    ],
  });

  console.log('✅ Mediasoup Worker and Router created');
}

/**
 * ✅ Create WebRTC Transport for a client
 */
async function createWebRtcTransport() {
  try {
    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.ANNOUNCED_IP || 'YOUR_PUBLIC_IP', // 🔥 Change this in production
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    console.log('✅ WebRTC Transport created:', transport.id);

    transport.on('dtlsstatechange', dtlsState => {
      if (dtlsState === 'closed') {
        console.log('🛑 Transport closed');
        transport.close();
      }
    });

    transport.on('close', () => {
      console.log('🚪 Transport closed');
    });

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  } catch (err) {
    console.error('❌ Error creating WebRTC transport:', err);
    throw err;
  }
}

module.exports = {
  startMediasoup,
  router,
  transports,
  producers,
  consumers,
  peers,
  createWebRtcTransport,
};
