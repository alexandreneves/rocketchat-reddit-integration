class Script {
    constructor() {
        this.config = {
            url: 'https://www.reddit.com',
            nsfw: false,
            subreddit: 'worldnews',
            filter: 'new',
            limit: 3,
            limitMax: 15,
            user: {
                alias: 'Reddit',
                avatar: 'https://i.imgur.com/7pQqJNy.png'
            },
            msg: {
                error: { text: 'an error occurred, please try again' },
                nsfw: {
                    title: 'Ya filthy animal!',
                    title_link: 'http://reddit.com/r/eyebleach',
                    text: 'Never gonna give you up! Never gonna let you down!',
                    image_url: 'http://media.giphy.com/media/olAik8MhYOB9K/giphy.gif',
                    color: 'red',
                    collapsed: true
                }
            }
        };
    }

    getParams(request) {
        const params = request.data.text
            .toLowerCase()
            .trim()
            .split(' ');

        params.shift();

        let [subreddit = this.config.subreddit, filter = this.config.filter, limit = this.config.limit] = params;

        limit = limit > this.config.limitMax ? this.config.limitMax : limit;

        return {
            subreddit,
            filter,
            limit
        };
    }

    prepare_outgoing_request({ request }) {
        const params = this.getParams(request);

        // ABOUT

        const aboutResponse = HTTP('GET', `${this.config.url}/r/${params.subreddit}/about.json`);

        if (!aboutResponse || aboutResponse.error) return { message: { ...this.config.user, ...this.config.msg.error } };

        const about = JSON.parse(aboutResponse.result.content);

        // CHECK IF SUBREDDIT EXISTS

        if (!about.data.id) return { message: { ...this.config.user, text: `/r/${params.subreddit} not found` } };

        // CHECK IF NSFW

        if (!this.config.nsfw && about.data.over18) return { message: { ...this.config.user, attachments: [this.config.msg.nsfw] } };

        // GET SUBREDDIT LISTING

        return {
            url: `${this.config.url}/r/${params.subreddit}/${params.filter}.json?raw_json=1&limit=${params.limit}`,
            headers: request.headers,
            method: 'GET'
        };
    }

    process_outgoing_response({ request, response }) {
        if (!response || response.error) return { content: { ...this.config.msg.error } };

        const data = JSON.parse(response.content_raw);
        const list = data.data.children;

        const attachments = list.map(item => {
            const attachment = {};

            if (!this.config.nsfw && item.data.over18) {
                attachment = { ...this.config.msg.nsfw };
            } else {
                attachment.title = item.data.title;
                attachment.title_link = this.config.url + item.data.permalink;
                attachment.text = item.data.selftext;
                attachment.color = 'green';
                attachment.ts = new Date(item.data.created * 1000).toISOString();
                attachment.collapsed = true;

                try {
                    attachment.image_url = item.data.preview.images[0].source.url;
                } catch (err) {
                    // no image found
                }
            }

            return attachment;
        });

        return {
            content: {
                ...this.config.user,
                attachments
            }
        };
    }
}
