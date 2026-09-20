"""
Small statistics helpers shared by the pipeline and the notebooks.

Ported verbatim from cla/SIF_classification_baseline.ipynb so that src/ and the
notebooks report intervals the same way. Any rate computed on a small corpus must
be reported with its interval and its n.
"""
import math


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """
    95% Wilson score interval for k successes out of n.

    Preferred over the normal approximation because it stays inside [0, 1] and
    behaves sensibly for small n and for proportions near 0 or 1 - which is
    exactly the regime a 10-document corpus sits in.
    """
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    d = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / d
    return (max(0.0, centre - half), min(1.0, centre + half))


def rate_str(k: int, n: int) -> str:
    """Format a rate as 'X/N = P% [lo, hi]' - point estimate never shown alone."""
    if n == 0:
        return "0/0 = n/a"
    lo, hi = wilson(k, n)
    return f"{k}/{n} = {k / n:.1%} [{lo:.1%}, {hi:.1%}]"
