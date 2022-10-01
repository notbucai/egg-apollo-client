import { Application, IBoot } from 'egg';

import * as merge from 'lodash.merge';
import * as clonedeep from 'lodash.clonedeep';

import { IApolloConfig } from '@bucai/apollo-client/dist/interface/IApolloConfig';

import Apollo from './app/lib/apollo';
import * as path from 'path';
import loadTs from './lib/loadTs';

export default class FooBoot implements IBoot {
    private app: Application & {apollo?: Apollo};

    constructor(app: Application & {apollo?: Apollo}) {
        this.app = app;
    }

    configWillLoad() {
        const app = this.app;

        const config: IApolloConfig = app.config.apollo;
        if (config.init_on_start === false) {
            return;
        }

        if (!app.apollo) {
            app.apollo = new Apollo(app.config.apollo, app);
            app.apollo.init();

            const appConfig = this.app.config;
            const apolloConfigPath = path.resolve(appConfig.baseDir, 'config/config.apollo.js');

            try {
                const apolloConfigFunc: Function = loadTs(apolloConfigPath).default || loadTs(apolloConfigPath);
                const apolloConfig = apolloConfigFunc(app.apollo, clonedeep(app.config));

                merge(app.config, apolloConfig);
                app.apollo.emit('config.loaded');
                return;
            } catch (_) {
                app.logger.warn('[egg-apollo-client] loader config/config.apollo.js error');
            }

        }
    }

    async willReady() {
        const config: IApolloConfig = this.app.config.apollo;
        if (config.watch) {
            this.app.apollo.startNotification();
        }
    }
}
