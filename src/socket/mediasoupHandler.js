const mediasoup = require('mediasoup');

let worker;
const routers = {};    // 🔥 Room-wise routers
const transports = {};
const producers = {};
const consumers = {};
const peers = {};

/**
 * ✅ Start Mediasoup Worker
 */
async function startMediasoup() {
  worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });

  worker.on('died', () => {
    console.error('❌ Mediasoup worker has died');
    process.exit(1);
  });

  console.log('✅ Mediasoup Worker created');
}

/**
 * ✅ Create Router per Room
 */
async function createRouter(roomId) {
  const mediaCodecs = [
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
    },
  ];

  const router = await worker.createRouter({ mediaCodecs });
  routers[roomId] = router;
  console.log(`✅ Router created for room ${roomId}`);
  return router;
}

/**
 * ✅ Get Router of Room
 */
function getRouter(roomId) {
  return routers[roomId];
}

/**
 * ✅ Create WebRTC Transport
 */
async function createWebRtcTransport(router) {
  try {
    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.ANNOUNCED_IP || 'YOUR_PUBLIC_IP',
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
  } catch (error) {
    console.error('❌ Error creating WebRTC Transport:', error);
    throw error;
  }
}

module.exports = {
  startMediasoup,
  createRouter,
  getRouter,
  createWebRtcTransport,
  routers,
  transports,
  producers,
  consumers,
  peers,
};
