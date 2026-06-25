export default class Ad {
  constructor(adUnitId = '') {
    this.adUnitId = adUnitId;
    this.rewardedVideoAd = null;
    this.rewardCallback = null;
    this.failCallback = null;

    if (adUnitId) {
      this.init(adUnitId);
    }
  }

  init(adUnitId) {
    this.adUnitId = adUnitId;

    if (
      typeof wx === 'undefined'
      || typeof wx.createRewardedVideoAd !== 'function'
      || !adUnitId
    ) {
      this.rewardedVideoAd = null;
      return;
    }

    this.destroy();
    this.rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId });

    this.rewardedVideoAd.onError((error) => {
      if (this.failCallback) {
        this.failCallback(error);
      }
    });

    this.rewardedVideoAd.onClose((result) => {
      const isCompleted = !result || result.isEnded;

      if (isCompleted && this.rewardCallback) {
        this.rewardCallback();
        return;
      }

      if (!isCompleted && this.failCallback) {
        this.failCallback(result);
      }
    });
  }

  load() {
    if (!this.rewardedVideoAd) {
      return Promise.reject(new Error('Rewarded video ad is not available.'));
    }

    return this.rewardedVideoAd.load();
  }

  show() {
    if (!this.rewardedVideoAd) {
      return Promise.reject(new Error('Rewarded video ad is not available.'));
    }

    return this.rewardedVideoAd.show();
  }

  showAd(onSuccess, onFail) {
    this.rewardCallback = onSuccess;
    this.failCallback = onFail;

    if (!this.rewardedVideoAd) {
      if (this.failCallback) {
        this.failCallback(new Error('Rewarded video ad is not available.'));
      }
      return;
    }

    this.rewardedVideoAd.show().catch(() => {
      this.rewardedVideoAd
        .load()
        .then(() => this.rewardedVideoAd.show())
        .catch((error) => {
          if (this.failCallback) {
            this.failCallback(error);
          }
        });
    });
  }

  onReward(callback) {
    this.rewardCallback = callback;
  }

  destroy() {
    if (this.rewardedVideoAd && this.rewardedVideoAd.offError) {
      this.rewardedVideoAd.offError();
    }

    if (this.rewardedVideoAd && this.rewardedVideoAd.offClose) {
      this.rewardedVideoAd.offClose();
    }

    this.rewardedVideoAd = null;
  }
}

