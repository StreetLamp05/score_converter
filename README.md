The UGA Psychoeducational Assessment Clinic needed a quick, reliable way to convert between the five standard psychometric score formats used in educational and psychological testing: z-scores, T-scores, standard scores, scaled scores, and percentile ranks. Their team had been referencing static conversion tables by hand and couldn't find an existing tool that did what they needed.
 
I built a lightweight single-page app that lets clinicians select any of the five score types, enter a value, and instantly see the equivalent scores across all other formats. The app also displays a bell curve visualization showing where the entered score falls on the distribution, along with a descriptive classification label (Average, Superior, etc.) based on the standard score equivalent.
 
<a href="https://score-converter-kappa.vercel.app" target="_blank">Live Demo</a>
 
## How Conversions Are Performed
 
All score types are converted through the z-score as a common intermediate. The linear transformations are straightforward:
 
$$
T = z \times 10 + 50
$$

$$
SS = z \times 15 + 100
$$

$$
\text{Scaled} = z \times 3 + 10
$$

Percentile conversions use statistical approximations of the normal distribution:
 
### Z-Score to Percentile
 
Uses the Abramowitz & Stegun polynomial approximation of the normal CDF (formula 26.2.17, error &lt; 7.5 × 10⁻⁸).
 
**Reference:** [Abramowitz & Stegun, p. 932](https://personal.math.ubc.ca/~cbm/aands/page_932.htm)
 
### Percentile to Z-Score
 
Uses the Beasley-Springer-Moro algorithm for the inverse normal CDF (error &lt; 1.0 × 10⁻⁸). The central region (8th–92nd percentile) uses a Beasley-Springer rational approximation, while the tails use Moro's Chebyshev-like polynomial expansion on the log-log transformed input.
 
**Reference:** [Beasley-Springer-Moro (via QuantStart, p. 16)](https://www.quantstart.com/static/ebooks/cpp/sample.pdf)
