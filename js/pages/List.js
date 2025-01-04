import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Poin:</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Kata sandi</div>
                            <p>{{ level.password || 'Gratis copy' }}</p>
                        </li>
                        <li>
                        <div class="type-title-sm">Demon difficulty</div>
                            <p>{{ level.difficulty || 'Demon' }}</p>
                        </li>
                    </ul>
                    <h2>Rekor</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> atau lebih baik untuk kualifikasi</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> atau lebih baik untuk kualifikasi</p>
                    <p v-else>Level ini tidak menerima rekor baru.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Layout website dibuat oleh <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>Daftar editor</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Catatan</h3>
                    <p>Peringkatnya mungkin tidak akurat, saya (Dittor76) hanya memprogram untuk membuat website ini, yg lainnya seperti posisi demon berasal dari opini org lain, jadi jika kamu tidak setuju dengan sebuah level seperti misrate atau posisi, jangan salahkan saya :')</p>
                    <h3>Persyaratan pengiriman</h3>
                    <p>
                        Mencapai rekor tanpa menggunakan hack (namun, bypass FPS diperbolehkan, hingga 360fps)
                    </p>
                    <p>
                        Mencapai rekor pada level yang tercantum di situs - harap periksa ID level sebelum kamu mengirimkan rekor
                    </p>
                    <p>
                        Memiliki audio sumber atau klik/sentuhan dalam video. Hanya audio yang diedit tidak dihitung
                    </p>
                    <p>
                        Rekaman harus memiliki attempts sebelumnya dan animasi kematian secara keseluruhan yang ditampilkan sebelum penyelesaian, kecuali penyelesaian dilakukan pada attempt pertama. Setiap rekaman permainan dikecualikan dari hal ini
                    </p>
                    <p>
                        Rekaman juga harus menunjukkan pemain menabrak dinding ujung (akhir level), atau penyelesaian akan dibatalkan.
                    </p>
                    <p>
                        Jangan gunakan rute rahasia atau rute bug
                    </p>
                    <p>
                        Jangan gunakan mode mudah, hanya catatan level yang tidak dimodifikasi yang memenuhi syarat
                    </p>
                    <p>
                        Setelah level jatuh ke daftar legasi, kami menerima rekor untuk level tersebut selama 24 jam setelah jatuh, kemudian setelah itu kami tidak akan pernah menerima rekor untuk level tersebut
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
