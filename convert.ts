type ScoreResult = {
    z: number;
    t: number;
    ss: number;
    scaled: number;
    percentile: number;
}

/**
 *
 * @param value given value
 * @param from given value type (z, t, ss, scaled, percentile)
 * @param to output value (z, t, ss, scaled, percentile)
 * key:
 * z: z-score
 * t: t-score
 * ss: standard score
 * scaled: scaled score
 * percentile: percentile
 */
function convert(value: number, from: string, to: string): ScoreResult {
    to = to.toLowerCase()
    from = from.toLowerCase()
    if (!(from === "z" || from === "t" || from === "ss" || from === "scaled" || from === "percentile")) {
        throw new Error("Invalid input: from");
    } else if (!(to === "z" || to === "t" || to === "ss" || to === "scaled" || to === "percentile") ) {
        throw new Error("Invalid input: to");
    } else if (to === from) {
        throw new Error("Invalid input: *from cannot equal *to");
    }

    let z: number;
    if (from !== "z") {
        if (from === "t") {
            z = tToZ(value);
        } else if (from === "ss") {
            z = ssToZ(value);
        } else if (from === "scaled") {
            z == scaledToZ(value);
        } else if (from === "percentile") {
            z == percentileToZ(value);
        }
    } else {
        z = value
    }

    return {
        z: z,
        t: zToT(z),
        ss: zToSS(z),
        scaled: zToScaled(z),
        percentile: zToPercentile(z),
    };
}

/**
 * Z-Score to T-Score helper
 * T = (z * 10) + 50
 *
 */
function zToT(z: number): number {
    return (z * 10) + 50;
}

/**
 * T-Score to Z-Score Helper
 * @param t T-Score
 */
function tToZ(t: number): number {
    return (t - 50) / 10;
}


/**
 * Z-Score to Standard Score helper
 * @param z
 */
function zToSS(z: number): number {
    return (z * 15) + 100;
}

/**
 * Standard Score to Z-Score helper
 * @param ss
 */
function ssToZ(ss: number): number {
    return (ss - 100) / 15;
}

/**
 * Z-Score to Scaled Score helper
 * @param z
 */
function zToScaled(z: number): number {
    return (z * 3) + 10;
}

/**
 * Scaled Score to Z-Score
 * @param scaled
 */
function scaledToZ(scaled: number): number {
    return (scaled - 10) / 3;
}

function zToPercentile(z: number): number {
    return normalCDF(z) * 100;
}

/**
 *
 * https://personal.math.ubc.ca/~cbm/aands/page_932.htm
 * @param z
 */
function normalCDF(z: number): number {
    // Abramowitz & Stegun approximation (error < 7.5e-8)
    const k = 1 / (1 + 0.2316419 * Math.abs(z));
    const poly = k * (0.319381530
        + k * (-0.356563782
            + k * (1.781477937
                + k * (-1.821255978
                    + k *  1.330274429))));
    const p = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;
    return z >= 0 ? p : 1 - p;
}

function percentileToZ(percentile: number): number {
    return inverseCDF(percentile / 100);
}


/**
 *
 * https://www.quantstart.com/static/ebooks/cpp/sample.pdf (pp. 16)
 * @param p
 */
function inverseCDF(p: number): number {
    const a: number[] = [
        2.50662823884,
        -18.61500062529,
        41.39119773534,
        -25.44106049637
    ];
    const b: number[] = [
        -8.47351093090,
        23.08336743743,
        -21.06224101826,
        3.13082909833
    ];
    const c: number[] = [
        0.3374754822726147,
        0.9761690190917186,
        0.1607979714918209,
        0.0276438810333863,
        0.0038405729373609,
        0.0003951896511919,
        0.0000321767881768,
        0.0000002888167364,
        0.0000003960315187
    ];

    const y = p - 0.5;

    if (Math.abs(y) < 0.42) {
        const r = y * y;
        return y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) /
            ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1);
    } else {
        const r = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p));
        let x = c[0] + r * (c[1] + r * (c[2] + r * (c[3] + r * (c[4] +
            r * (c[5] + r * (c[6] + r * (c[7] + r * c[8])))))));
        return p < 0.5 ? -x : x;
    }
}
