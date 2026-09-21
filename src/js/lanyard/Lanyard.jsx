/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

import * as THREE from 'three';

// Vendored from https://reactbits.dev/components/lanyard
//
// Four deviations from upstream:
//  1. card.glb and lanyard.png are referenced by URL instead of imported, so
//     they stay in the hand-maintained dist/images/ flow like every other
//     image on the site rather than being hashed into a JS chunk. card.glb is
//     2.4MB and has no business in a bundle.
//  2. Upstream's ./Lanyard.css was ported to src/scss/components/_lanyard.scss
//     so all styling stays in the existing SCSS pipeline. Importing it here
//     would emit a stylesheet nothing links to, since Vite doesn't process
//     index.html in this setup.
//  3. onDragChange prop — see the comment on it below.
//  4. cardMetalness / cardRoughness props. Upstream hardcodes metalness 0.8,
//     which reads as sheen on its dark demo card but turns our white badge
//     into grey haze. Defaults are unchanged so upstream behaviour is intact
//     unless overridden.
//  5. blankBack prop. The baked atlas has reactbits.dev branding on the card's
//     back face, which is visible whenever the card spins. Defaults to false
//     so upstream behaviour is unchanged.
//  6. lanyardColor prop. lanyard.png is a black band with the React Bits atom
//     logo tiled along it. Setting a colour drops the map for a plain band.
//  7. flat prop, forwarded to Canvas. R3F defaults to ACES filmic tone
//     mapping, which caps pure white at ~236/255 — fine for a dark demo card,
//     but it makes a white badge read grey against a near-white page.
//  8. anchorY prop. R3F's default camera does lookAt( 0, 0, 0 ), which pins
//     the world origin to the centre of the canvas — so the camera's y cannot
//     pan the framing, it only tilts the view. Moving the rig is the only way
//     to compose the card vertically. All default to upstream behaviour.
const cardGLB = '/images/card.glb';
const lanyard = '/images/lanyard.png';

extend({ MeshLineGeometry, MeshLineMaterial });

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

// The card stock has a fine paper grain baked into the atlas, so a face is
// blanked by restamping it with the card's own material rather than filling it
// with a flat colour, which would read as a dead plastic patch next to the
// grainy card edges.
//
// This is the patch to stamp with. Measured from card.glb (atlas is
// 1678x1677): everything below the front face's artwork is unprinted grain,
// and it is exactly one face wide. That makes it the largest usable source —
// a face is covered in a single column with no vertical seam, needing only one
// mirrored repeat vertically.
const BLANK_GRAIN_RECT = { x: 0, y: 0.6, w: 0.5, h: 0.4 };

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  lanyardColor = null,
  cardMetalness = 0.8,
  cardRoughness = 0.9,
  blankBack = false,
  flat = false,
  anchorY = 4,
  // Fires true when the card is grabbed and false when released. The host page
  // scrolls horizontally off document-level touch handlers, so it needs to know
  // when a touch gesture belongs to the badge rather than to navigation.
  onDragChange = null
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        flat={flat}
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            lanyardColor={lanyardColor}
            cardMetalness={cardMetalness}
            cardRoughness={cardRoughness}
            blankBack={blankBack}
            anchorY={anchorY}
            onDragChange={onDragChange}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  lanyardColor = null,
  cardMetalness = 0.8,
  cardRoughness = 0.9,
  blankBack = false,
  anchorY = 4,
  onDragChange = null
}) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || lanyard);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage && !blankBack) return baseMap;

    const baseImg = baseMap.image;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;
    // Keep the original baked atlas for the card edges and any untouched face.
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img, rect) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    // Restamp a face with clean card grain. The patch is drawn at 1:1 so the
    // grain keeps the same scale as the rest of the card, and alternate tiles
    // are mirrored so the repeat reads as continuous rather than as a step.
    //
    // Everything is rounded to whole pixels: at fractional offsets drawImage
    // resamples the patch edges and each tile boundary shows up as a faint
    // seam line.
    const fillWithGrain = rect => {
      const sx = Math.round(BLANK_GRAIN_RECT.x * W);
      const sy = Math.round(BLANK_GRAIN_RECT.y * H);
      const sw = Math.round(BLANK_GRAIN_RECT.w * W);
      const sh = Math.round(BLANK_GRAIN_RECT.h * H);
      const rx = Math.round(rect.x * W);
      const ry = Math.round(rect.y * H);
      const rw = Math.round(rect.w * W);
      const rh = Math.round(rect.h * H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      for (let ty = 0; ty * sh < rh; ty++) {
        for (let tx = 0; tx * sw < rw; tx++) {
          const flipX = tx % 2 === 1;
          const flipY = ty % 2 === 1;
          ctx.save();
          ctx.translate(rx + tx * sw, ry + ty * sh);
          ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
          ctx.drawImage(baseImg, sx, sy, sw, sh, flipX ? -sw : 0, flipY ? -sh : 0, sw, sh);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    // Blank first so an explicit backImage still wins.
    if (blankBack) fillWithGrain(BACK_UV_RECT);
    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
    if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, blankBack, imageFit, frontTex, backTex, materials.base.map]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useEffect(() => {
    onDragChange?.(!!dragged);
  }, [dragged, onDragChange]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, anchorY, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={cardRoughness}
                metalness={cardMetalness}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color={lanyardColor || 'white'}
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={lanyardColor ? 0 : 1}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
