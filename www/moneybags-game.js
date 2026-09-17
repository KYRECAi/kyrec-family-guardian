(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MoneybagsGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEFAULTS = { durationSeconds: 60, targetScore: 1000, coinScore: 50 };

  function clampDuration(value) {
    var duration = Number(value);
    if (!Number.isFinite(duration)) return DEFAULTS.durationSeconds;
    return Math.min(120, Math.max(45, Math.round(duration)));
  }

  function createState(options) {
    options = options || {};
    var duration = clampDuration(options.durationSeconds);
    return {
      phase: "ready",
      durationSeconds: duration,
      secondsLeft: duration,
      targetScore: Math.max(DEFAULTS.coinScore, Number(options.targetScore) || DEFAULTS.targetScore),
      score: 0,
      combo: 0,
      lastGain: 0,
      familyPointsAwarded: 0,
      rewardStatus: "not-requested"
    };
  }

  function canStart(authority) {
    return Boolean(authority && authority.kind === "simulated" && authority.status === "approved" && authority.adultApproved === true);
  }

  function start(state, authority) {
    if (!canStart(authority)) {
      state.phase = "locked";
      state.rewardStatus = "authority-required";
      return false;
    }
    state.phase = "playing";
    state.rewardStatus = "game-score-only";
    return true;
  }

  function collectCoin(state) {
    if (state.phase !== "playing") return 0;
    state.score += DEFAULTS.coinScore;
    state.combo += 1;
    state.lastGain = DEFAULTS.coinScore;
    if (state.score >= state.targetScore) state.phase = "won";
    return DEFAULTS.coinScore;
  }

  function tick(state) {
    if (state.phase !== "playing") return state.phase;
    state.secondsLeft = Math.max(0, state.secondsLeft - 1);
    if (state.secondsLeft === 0) state.phase = state.score >= state.targetScore ? "won" : "finished";
    return state.phase;
  }

  function pause(state) {
    if (state.phase === "playing") state.phase = "paused";
  }

  function resume(state) {
    if (state.phase === "paused") state.phase = "playing";
  }

  function reset(state) {
    var fresh = createState({ durationSeconds: state.durationSeconds, targetScore: state.targetScore });
    Object.keys(fresh).forEach(function (key) { state[key] = fresh[key]; });
    return state;
  }

  return { DEFAULTS: DEFAULTS, createState: createState, canStart: canStart, start: start, collectCoin: collectCoin, tick: tick, pause: pause, resume: resume, reset: reset };
});
