import { Box, Typography } from '@mui/material';
import Lottie from 'lottie-react';


const LoadingAnimation = ({ size = 300, showText = false }) => {
  // Sewing machine stitch animation
  const animationData = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 500,
    h: 500,
    nm: "Sewing Machine",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Thread",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [250, 250, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "sh",
                d: 1,
                ks: {
                  a: 1,
                  k: [
                    {
                      i: { x: 0.667, y: 1 },
                      o: { x: 0.333, y: 0 },
                      t: 0,
                      s: [
                        {
                          i: [[0, 0], [0, 0], [0, 0]],
                          o: [[0, 0], [0, 0], [0, 0]],
                          v: [[-100, -80], [0, 0], [100, 80]],
                          c: false
                        }
                      ]
                    },
                    {
                      t: 45,
                      s: [
                        {
                          i: [[0, 0], [0, 0], [0, 0]],
                          o: [[0, 0], [0, 0], [0, 0]],
                          v: [[-100, -80], [20, 30], [100, 80]],
                          c: false
                        }
                      ]
                    }
                  ]
                }
              },
              {
                ty: "st",
                c: { a: 0, k: [0.4, 0.49, 0.92, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 8 },
                lc: 2,
                lj: 2
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Needle",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: {
            a: 1,
            k: [
              {
                i: { x: 0.667, y: 1 },
                o: { x: 0.333, y: 0 },
                t: 0,
                s: [250, 150, 0]
              },
              {
                i: { x: 0.667, y: 1 },
                o: { x: 0.333, y: 0 },
                t: 15,
                s: [250, 220, 0]
              },
              {
                i: { x: 0.667, y: 1 },
                o: { x: 0.333, y: 0 },
                t: 30,
                s: [250, 150, 0]
              },
              {
                i: { x: 0.667, y: 1 },
                o: { x: 0.333, y: 0 },
                t: 45,
                s: [250, 220, 0]
              },
              {
                t: 60,
                s: [250, 150, 0]
              }
            ]
          },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 0, k: [6, 40] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 3 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.29, 0.29, 0.29, 1] },
                o: { a: 0, k: 100 }
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 3,
        ty: 4,
        nm: "Stitch Dots",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [250, 250, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "el",
                d: 1,
                s: { a: 0, k: [10, 10] },
                p: {
                  a: 1,
                  k: [
                    {
                      i: { x: 0.667, y: 1 },
                      o: { x: 0.333, y: 0 },
                      t: 0,
                      s: [-60, 0]
                    },
                    {
                      t: 45,
                      s: [60, 0]
                    }
                  ]
                }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.46, 0.30, 0.64, 1] },
                o: {
                  a: 1,
                  k: [
                    {
                      i: { x: [0.667], y: [1] },
                      o: { x: [0.333], y: [0] },
                      t: 0,
                      s: [0]
                    },
                    {
                      i: { x: [0.667], y: [1] },
                      o: { x: [0.333], y: [0] },
                      t: 15,
                      s: [100]
                    },
                    {
                      t: 30,
                      s: [0]
                    }
                  ]
                }
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  };


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        width: '100%',
        gap: 2
      }}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        style={{ width: size, height: size, filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))' }}
      />
      {showText && (
        <Typography sx={{ color: '#667eea', fontWeight: 600, fontSize: '1rem' }}>
          Stitching things together...
        </Typography>
      )}
    </Box>
  );
};


export default LoadingAnimation;



