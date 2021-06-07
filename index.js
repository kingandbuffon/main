import fetch from 'node-fetch';
import PG from 'pg';

const clientId = '6d41a520e2b6ab2';

const getTags = async () => {
    const response = await fetch('https://api.imgur.com/3/tags', {
        method: 'GET',
        headers: {
            'Authorization': `Client-ID ${clientId}`
        }
    });
    return JSON.parse(await response.text()).data.tags;
}

const getImg = async (tagName) => {
    const tag = tagName.replace(/_/g, '');
    const response = await fetch(`https://api.imgur.com/3/gallery/search/top/all/1?q=${tag}`, {
        method: 'GET',
        headers: {
            'Authorization': `Client-ID ${clientId}`
        }
    });
    const imgData = JSON.parse(await response.text()).data;
    if (imgData.error) {
        await timesleep(1);
        await getImg(tagName);
        //Привышена квота запросов
    } else {
        if (imgData.length !== 0) {
            for (let item of imgData) {
                if (item.images) {
                    saveImg(item.images);
                }
            }
        }
    }
}

const saveImg = (item) => {
    for (let img of item) {
        const findType = img.link.split('.');
        const typeArrLength = findType.length - 1;
        if (findType[typeArrLength] === 'jpg' || findType[typeArrLength] === 'png' || findType[typeArrLength] === 'img') {
            // Если я правильно понял тз - при ненадобности убрать условие проверки
            PgRequest(`insert into img_data (hyperlink,img_type) values ('${img.link}','${img.type}')`);
            // Я положил тип изображения не знал какую еще побочную информацию необходимо брать. (можно передать весь обьект в JSON и записать его)
        }
    }
}

const PgRequest = async (rqst) => {
    return new Promise(async (resolve) => {
        const pool = new PG.Pool({
            host: "host",
            user: "user",
            database: "database",
            password: "password",
        });
        pool
            .query(rqst).then(res => {
                return resolve([false, res.rows]);
            })
            .catch(err => {
                console.log('ERROR', err)
                // Записать в БагТрекер или бд для логов ошибки или другие системы логирования
                return resolve([true, err])
            })
    });
}

const timesleep = (sec) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            return resolve();
        }, sec * 1000)
    })
}

(async () => {
    const tags = await getTags();
    for (let item of tags) {
        await getImg(item.name);
        // Намного быстрее было бы вызывать функцию в синхроне, но тогда мы привысим квоту запросов. Это самый оптимальный вариант - последовательность тегов - и запись Х картинок.
        // Так же есть возможность использовать прокси при привышения квоты запросов.
        // await timesleep(1);
    }
})();