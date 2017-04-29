module.exports = {
    parserOptions: {
        sourceType: 'script',
    },
    rules: {
        indent: [2, 4],
        'no-param-reassign': 0,
        'comma-dangle': [
            'error',
            {
                arrays: 'only-multiline',
                objects: 'only-multiline',
                functions: 'ignore',
            },
        ],
        strict: ['error', 'global'],
    },

    env: {
        node: true,
    },

    extends: ['airbnb-base'],
};

