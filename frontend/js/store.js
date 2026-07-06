class Store {
    constructor() {
        this.state = {
            user: {
                username: '',
                level: 1,
                experience: 0,
                gold: 0,
                avatar: '😊',
                xp_progress: 0,
                xp_for_next_level: 100,
                xp_remaining: 100
            },
            habits: [],
            dailyQuests: []
        };
        this.listeners = [];
        this._loadFromStorage();
    }

    _loadFromStorage() {
        const keys = ['username', 'level', 'experience', 'gold', 'avatar', 
                      'xp_progress', 'xp_for_next_level', 'xp_remaining'];
        keys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) {
                if (['level', 'experience', 'gold', 'xp_remaining', 'xp_for_next_level'].includes(key)) {
                    this.state.user[key] = parseInt(val);
                } else if (key === 'xp_progress') {
                    this.state.user[key] = parseFloat(val);
                } else {
                    this.state.user[key] = val;
                }
            }
        });
    }

    updateUser(data) {
        this.state.user = { ...this.state.user, ...data };
        Object.entries(data).forEach(([key, val]) => {
            const storageKey = key === 'avatar_skin' ? 'avatar' : key;
            localStorage.setItem(storageKey, val);
        });
        this.notify();
    }

    getUser() {
        return { ...this.state.user };
    }

    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    }

    clear() {
        ['token', 'username', 'level', 'experience', 'gold', 'avatar', 
         'user_id', 'xp_progress', 'xp_for_next_level', 'xp_remaining'].forEach(k => localStorage.removeItem(k));
        this.state.user = { username: '', level: 1, experience: 0, gold: 0, avatar: '😊', xp_progress: 0, xp_for_next_level: 100, xp_remaining: 100 };
        this.notify();
    }
}

const store = new Store();
export default store;