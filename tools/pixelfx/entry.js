// Entry for bundling the parts of pixelfx that Hell's Deck uses into one classic script (window.PixelFX).
import { createFrame, clearFrame, createFx, composite, PAL } from "../pixelfx_src/src/core/index.js";
import * as fireball from "../pixelfx_src/src/fx/fire/fireball.js";
import * as iceLance from "../pixelfx_src/src/fx/ice/ice-lance.js";
import * as laserBolt from "../pixelfx_src/src/fx/projectiles/laser-bolt.js";
import * as bulletTracer from "../pixelfx_src/src/fx/projectiles/bullet-tracer.js";
import * as hitSpark from "../pixelfx_src/src/fx/impacts/hit-spark.js";
import * as bulletImpact from "../pixelfx_src/src/fx/impacts/bullet-impact.js";
import * as plasmaExplosion from "../pixelfx_src/src/fx/explosions/plasma-explosion.js";
import * as groundSlam from "../pixelfx_src/src/fx/impacts/ground-slam.js";
import * as heavyCleave from "../pixelfx_src/src/fx/melee/heavy-cleave.js";
import * as critHit from "../pixelfx_src/src/fx/impacts/crit-hit.js";
import * as flamePillar from "../pixelfx_src/src/fx/fire/flame-pillar.js";
import * as fireRing from "../pixelfx_src/src/fx/fire/fire-ring.js";
import * as confetti from "../pixelfx_src/src/fx/ui/confetti.js";
import * as fireworkBurst from "../pixelfx_src/src/fx/explosions/firework-burst.js";

window.PixelFX = {
  createFrame, clearFrame, createFx, composite, PAL,
  fx: {
    "fire/fireball": fireball,
    "ice/ice-lance": iceLance,
    "projectiles/laser-bolt": laserBolt,
    "projectiles/bullet-tracer": bulletTracer,
    "impacts/hit-spark": hitSpark,
    "impacts/bullet-impact": bulletImpact,
    "explosions/plasma-explosion": plasmaExplosion,
    "impacts/ground-slam": groundSlam,
    "melee/heavy-cleave": heavyCleave,
    "impacts/crit-hit": critHit,
    "fire/flame-pillar": flamePillar,
    "fire/fire-ring": fireRing,
    "ui/confetti": confetti,
    "explosions/firework-burst": fireworkBurst,
  },
};
