import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { BearCashColors, BearCashFonts } from "@/presentation/constants/theme";

export type CategoryBubbleSpec = {
  id: string;
  size: number;
  icon: number;
  color: string;
  iconKey: string;
  percent: number;
};

type SimBody = {
  active: number;
  held: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
};

const GRAVITY = 860;
const RESTITUTION = 0.72;
const WALL_RESTITUTION = 0.58;
const FLOOR_FRICTION = 0.22;
const AIR_DRAG = 0.12;
const SLEEP_SPEED = 14;
const CORRECTION = 0.86;
const SUBSTEPS = 2;
const MAX_BUBBLES = 8;
const TAP_MOVE = 8;
const MAX_THROW = 2800;
const SELECT_SCALE = 95.756 / 82.866;
const SELECT_MIN = 84;

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return hex;
  }
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function selectedSize(size: number) {
  return Math.max(Math.round(size * SELECT_SCALE), SELECT_MIN);
}

function emptyBody(): SimBody {
  return {
    active: 0,
    held: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 0,
    mass: 1,
  };
}

function seedBodies(specs: CategoryBubbleSpec[], width: number): SimBody[] {
  const count = Math.min(specs.length, MAX_BUBBLES);
  const bodies: SimBody[] = [];

  for (let index = 0; index < MAX_BUBBLES; index += 1) {
    const spec = specs[index];
    if (!spec || index >= count || width <= 0) {
      bodies.push(emptyBody());
      continue;
    }

    const r = spec.size / 2;
    const inner = Math.max(width - r * 2, 0);
    const t = count === 1 ? 0.5 : index / Math.max(count - 1, 1);
    const jitter = (Math.random() - 0.5) * Math.min(28, inner * 0.12);
    const x = r + inner * (0.12 + t * 0.76) + jitter;
    const y = -r - 10 - index * (18 + r * 0.22);

    bodies.push({
      active: 1,
      held: 0,
      x: Math.min(Math.max(x, r), Math.max(width - r, r)),
      y,
      vx: (Math.random() - 0.5) * 140,
      vy: 20 + Math.random() * 50,
      r,
      mass: Math.max(r * r, 1),
    });
  }

  return bodies;
}

function collide(a: SimBody, b: SimBody) {
  "worklet";
  if (a.active === 0 || b.active === 0) {
    return;
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDist = a.r + b.r;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minDist * minDist || distSq === 0) {
    return;
  }

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const invA = a.held === 1 ? 0 : 1 / a.mass;
  const invB = b.held === 1 ? 0 : 1 / b.mass;
  const invMass = invA + invB;
  if (invMass === 0) {
    return;
  }

  const overlap = minDist - dist;
  const corr = (overlap / invMass) * CORRECTION;
  a.x -= corr * invA * nx;
  a.y -= corr * invA * ny;
  b.x += corr * invB * nx;
  b.y += corr * invB * ny;

  const velN = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (velN > 0) {
    return;
  }

  const j = (-(1 + RESTITUTION) * velN) / invMass;
  a.vx -= j * invA * nx;
  a.vy -= j * invA * ny;
  b.vx += j * invB * nx;
  b.vy += j * invB * ny;
}

function bounceWalls(body: SimBody, width: number, height: number) {
  "worklet";
  if (body.active === 0) {
    return;
  }

  if (body.x < body.r) {
    body.x = body.r;
    if (body.held === 0) {
      body.vx = Math.abs(body.vx) * WALL_RESTITUTION;
    }
  } else if (body.x > width - body.r) {
    body.x = width - body.r;
    if (body.held === 0) {
      body.vx = -Math.abs(body.vx) * WALL_RESTITUTION;
    }
  }

  if (body.held === 1) {
    return;
  }

  if (body.y > height - body.r) {
    body.y = height - body.r;
    body.vy = -Math.abs(body.vy) * WALL_RESTITUTION;
    body.vx *= 1 - FLOOR_FRICTION;
    if (Math.abs(body.vy) < SLEEP_SPEED) {
      body.vy = 0;
    }
    if (Math.abs(body.vx) < SLEEP_SPEED) {
      body.vx = 0;
    }
  }
}

function clampThrow(value: number) {
  "worklet";
  return Math.max(-MAX_THROW, Math.min(MAX_THROW, value));
}

function PhysicsBubble({
  index,
  spec,
  selected,
  bodies,
  tick,
  onSelect,
  onDragActive,
}: {
  index: number;
  spec: CategoryBubbleSpec;
  selected: boolean;
  bodies: SharedValue<SimBody[]>;
  tick: SharedValue<number>;
  onSelect: (id: string) => void;
  onDragActive: (active: boolean) => void;
}) {
  const size = selected ? selectedSize(spec.size) : spec.size;
  const iconSize = selected ? Math.round(size * 0.308) : spec.icon;
  const percentSize = Math.max(12, Math.round(size * 0.192));
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const dragging = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    const frame = tick.value;
    const body = bodies.value[index];
    if (!body || body.active === 0) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: -999 }] };
    }
    return {
      opacity: 1,
      zIndex: selected || dragging.value === 1 ? 4 : 1,
      transform: [
        { translateX: body.x - body.r + frame * 0 },
        { translateY: body.y - body.r },
      ],
    };
  });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(TAP_MOVE)
    .onStart(() => {
      const body = bodies.value[index];
      if (!body || body.active === 0) {
        return;
      }
      originX.value = body.x;
      originY.value = body.y;
      dragging.value = 1;
      const next = bodies.value.map((item) => ({ ...item }));
      const held = next[index];
      if (held) {
        held.held = 1;
        held.vx = 0;
        held.vy = 0;
      }
      bodies.value = next;
      runOnJS(onDragActive)(true);
    })
    .onUpdate((event) => {
      const next = bodies.value.map((item) => ({ ...item }));
      const body = next[index];
      if (!body) {
        return;
      }
      body.x = originX.value + event.translationX;
      body.y = originY.value + event.translationY;
      body.vx = 0;
      body.vy = 0;
      body.held = 1;
      bodies.value = next;
      tick.value += 1;
    })
    .onEnd((event) => {
      const next = bodies.value.map((item) => ({ ...item }));
      const body = next[index];
      if (body) {
        body.held = 0;
        body.vx = clampThrow(event.velocityX);
        body.vy = clampThrow(event.velocityY);
      }
      bodies.value = next;
      dragging.value = 0;
      tick.value += 1;
      runOnJS(onDragActive)(false);
    })
    .onFinalize((_event, success) => {
      if (success) {
        return;
      }
      const next = bodies.value.map((item) => ({ ...item }));
      const body = next[index];
      if (body) {
        body.held = 0;
      }
      bodies.value = next;
      dragging.value = 0;
      runOnJS(onDragActive)(false);
    });

  const tap = Gesture.Tap()
    .maxDuration(280)
    .maxDistance(TAP_MOVE)
    .onEnd(() => {
      runOnJS(onSelect)(spec.id);
    });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.bubble, style]}>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          collapsable={false}
          style={[
            styles.bubbleHit,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: selected
                ? spec.color
                : withAlpha(spec.color, 0.2),
            },
          ]}
        >
          {selected ? (
            <View style={styles.selectedCopy} pointerEvents="none">
              <View style={{ width: iconSize, height: iconSize }}>
                <CategoryChipIcon
                  iconKey={spec.iconKey}
                  color={BearCashColors.background}
                  size={iconSize}
                />
              </View>
              <Text
                style={[
                  styles.percent,
                  { fontSize: percentSize, lineHeight: percentSize * 1.2 },
                ]}
              >
                {`${Math.round(spec.percent)}%`}
              </Text>
            </View>
          ) : (
            <View
              pointerEvents="none"
              style={{ width: spec.icon, height: spec.icon }}
            >
              <CategoryChipIcon
                iconKey={spec.iconKey}
                color={spec.color}
                size={spec.icon}
              />
            </View>
          )}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export function CategoryBubbleField({
  specs,
  width,
  height,
  selectedId,
  onSelect,
  onDragActive,
}: {
  specs: CategoryBubbleSpec[];
  width: number;
  height: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDragActive?: (active: boolean) => void;
}) {
  const visible = specs.slice(0, MAX_BUBBLES);
  const bodies = useSharedValue<SimBody[]>(seedBodies(specs, width));
  const world = useSharedValue({ width, height });
  const tick = useSharedValue(0);
  const signature = visible
    .map((spec) => `${spec.id}:${spec.size}`)
    .join("|");

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onDragRef = useRef(onDragActive);
  onDragRef.current = onDragActive;

  const emitSelect = useCallback((id: string) => {
    onSelectRef.current?.(id);
  }, []);

  const emitDrag = useCallback((active: boolean) => {
    onDragRef.current?.(active);
  }, []);

  useEffect(() => {
    world.value = { width, height };
    bodies.value = seedBodies(specs, width);
    tick.value += 1;
  }, [signature, width, height, specs, bodies, tick, world]);

  useEffect(() => {
    const next = bodies.value.map((body, index) => {
      const spec = specs[index];
      if (!spec || body.active === 0) {
        return body;
      }
      const size =
        selectedId === spec.id ? selectedSize(spec.size) : spec.size;
      const r = size / 2;
      return { ...body, r, mass: Math.max(r * r, 1) };
    });
    bodies.value = next;
    tick.value += 1;
  }, [selectedId, signature, bodies, tick, specs]);

  useFrameCallback((frame) => {
    "worklet";
    if (world.value.width <= 0) {
      return;
    }

    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 1 / 30);
    const step = dt / SUBSTEPS;
    const next = bodies.value.map((body) => ({ ...body }));
    const { width: boxW, height: boxH } = world.value;
    const drag = Math.max(0, 1 - AIR_DRAG * step);

    for (let sub = 0; sub < SUBSTEPS; sub += 1) {
      for (let i = 0; i < next.length; i += 1) {
        const body = next[i];
        if (!body || body.active === 0) {
          continue;
        }
        if (body.held === 0) {
          body.vy += GRAVITY * step;
          body.vx *= drag;
          body.vy *= drag;
          body.x += body.vx * step;
          body.y += body.vy * step;
        }
        bounceWalls(body, boxW, boxH);
      }

      for (let i = 0; i < next.length; i += 1) {
        for (let j = i + 1; j < next.length; j += 1) {
          const a = next[i];
          const b = next[j];
          if (a && b) {
            collide(a, b);
          }
        }
      }

      for (let i = 0; i < next.length; i += 1) {
        const body = next[i];
        if (body) {
          bounceWalls(body, boxW, boxH);
        }
      }
    }

    bodies.value = next;
    tick.value += 1;
  });

  if (width <= 0 || visible.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={{ width, height }}>
      {visible.map((spec, index) => (
        <PhysicsBubble
          key={spec.id}
          index={index}
          spec={spec}
          selected={spec.id === selectedId}
          bodies={bodies}
          tick={tick}
          onSelect={emitSelect}
          onDragActive={emitDrag}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  bubbleHit: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  selectedCopy: {
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontFamily: BearCashFonts.regular,
    color: BearCashColors.background,
    textAlign: "center",
  },
});
