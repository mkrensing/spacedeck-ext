class JsonCache {



    constructor(timeToLiveInSeconds) {

        this.timeToLiveInSeconds = timeToLiveInSeconds;

        this.cache = {};

        let _this = this;

        setInterval(function () {

            if (Object.keys(_this.cache).length > 0) {

                let currentTime = new Date();

                Object.keys(_this.cache).forEach(key => {

                    let seconds = currentTime - _this.cache[key].time;



                    if (seconds > _this.timeToLiveInSeconds) {

                        delete _this.cache[key];

                        console.log(`${key}'s cache deleted`)

                    }

                })

            }

        }, 3000);

    }



    get(key) {

        return this.cache[key];

    }



    add(key, object) {

        this.cache[key] = object;

    }



    cached(key, jsonCallback) {



        let cachedValue = this.get(key);

        let _this = this;

        if (cachedValue) {

            return cachedValue;

        }



        $.when(jsonCallback()).done(function (response) {



            console.log("cached.done", response);

            _this.add(key, response);

        });



    }

}



function constructJsonCache() {

    return new JsonCache(5 * 60);

}

