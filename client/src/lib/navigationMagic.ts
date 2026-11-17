export type MagicEffect = 'butterflies' | 'leaves' | 'rainbow' | 'fireflies' | 'meteor' | 'shimmer' | 'greeting';
export function selectMagicEffect(night: boolean, previous: MagicEffect | null, random = Math.random): MagicEffect {
  const pool: MagicEffect[] = night ? ['fireflies', 'meteor', 'shimmer', 'greeting'] : ['butterflies', 'leaves', 'rainbow', 'greeting'];
  const choices = pool.filter(effect => effect !== previous);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
}
export function magicPresentation(effect: MagicEffect, reduced: boolean) {
  return { effect: reduced ? 'still' : effect, duration: reduced ? 1600 : 2600, particles: reduced ? 0 : effect === 'butterflies' ? 4 : 7 };
}
