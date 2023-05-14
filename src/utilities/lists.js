const lists = {
    size: function (list) {
        if (Array.isArray(list)) {
            return list.length;
        } else if (typeof list === 'object' && list !== null) {
            return Object.keys(list).length;
        } else {
            return 0;
        }
    },

    isEmpty: function (list) {
        if (Array.isArray(list)) {
            return list.length === 0;
        } else if (typeof list === 'object' && list !== null) {
            return Object.keys(list).length === 0;
        } else {
            return false;
        }
    },

    contains: function (list, element) {
        if (Array.isArray(list)) {
            return list.includes(element);
        } else if (typeof list === 'object' && list !== null) {
            return Object.values(list).includes(element);
        }
        return false;
    },

    containsAll: function (list, elements) {
        if (Array.isArray(list)) {
            return elements.every(elem => list.includes(elem));
        } else if (typeof list === 'object' && list !== null) {
            const listValues = Object.values(list);
            return elements.every(elem => listValues.includes(elem));
        }
        return false;
    },

    sort: function (list, comparator) {
        if (Array.isArray(list)) {
            if (comparator) {
                return list.sort(comparator);
            } else {
                return list.sort();
            }
        } else if (typeof list === 'object' && list !== null) {
            const entries = Object.entries(list);
            if (comparator) {
                entries.sort((a, b) => comparator(a[1], b[1]));
            } else {
                entries.sort((a, b) => String(a[1]).localeCompare(String(b[1])));
            }
            return Object.fromEntries(entries);
        } else {
            return null;
        }
    }
};

export default lists;