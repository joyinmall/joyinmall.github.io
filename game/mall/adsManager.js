class AdsManager {
    constructor() {
    }

    init() {
        if (!window.integrationSite) {
            let fcAd = new TvAd('fc4', 'https://ficca2021.com/g/ai7w5urbci6abe1cea4a73f469699a/?ulp=https%3A%2F%2Fwww.kinguin.net%2Fcategory%2F172384%2Fea-sports-fc-24-ultimate-edition-ea-app-cd-key');
            let taddtoyAd = new TaddtoyAd('taddtoy', 'https://amzn.to/3QvTdhd');
        }

        let visitus = new Banner('visitus', 'https://www.joyinmall.com', -3, false, 3, 3);
        let onfb = new Banner('onfb', 'https://www.facebook.com/joyinmall', -3, true, 3, 3.37);
    }
}

window.adsManager = new AdsManager();