module.exports.timeParser = (durationStr) => {
    const units = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
    };

    const match = durationStr.match(/^(\d+)(s|m|h|d)$/);
    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * units[unit];
};
