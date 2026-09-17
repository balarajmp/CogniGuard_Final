import math
import random
from typing import List, Tuple

class GaussianMixture1D:
    """
    Pure Python implementation of a 1D Gaussian Mixture Model (GMM)
    using Expectation-Maximization (EM) algorithm.
    """
    def __init__(self, k: int = 2, max_iter: int = 50, tol: float = 1e-4):
        self.k = k
        self.max_iter = max_iter
        self.tol = tol
        self.weights: List[float] = []
        self.means: List[float] = []
        self.variances: List[float] = []

    def _normal_pdf(self, x: float, mean: float, var: float) -> float:
        """Calculate the probability density function of normal distribution."""
        if var <= 0.0:
            var = 1e-6
        denom = math.sqrt(2 * math.pi * var)
        num = math.exp(-((x - mean) ** 2) / (2 * var))
        return num / denom

    def fit(self, data: List[float]) -> bool:
        """
        Fits GMM to 1D data using EM.
        Returns True if converged, False otherwise.
        """
        n = len(data)
        if n < self.k * 2:
            # Fallback to simple mean/variance if not enough data
            if n > 0:
                mean = sum(data) / n
                var = sum((x - mean) ** 2 for x in data) / n if n > 1 else 1.0
                self.weights = [1.0] + [0.0] * (self.k - 1)
                self.means = [mean] + [mean] * (self.k - 1)
                self.variances = [var] + [var] * (self.k - 1)
                return True
            else:
                self.weights = [1.0 / self.k] * self.k
                self.means = [0.0] * self.k
                self.variances = [1.0] * self.k
                return False

        # Initialize parameters: k-means or simple split
        data_sorted = sorted(data)
        self.weights = [1.0 / self.k] * self.k
        self.means = []
        self.variances = []
        
        # Split data into k sections to initialize means and variances
        chunk_size = n // self.k
        for idx in range(self.k):
            chunk = data_sorted[idx * chunk_size : (idx + 1) * chunk_size]
            if not chunk:
                chunk = [data_sorted[0]]
            m = sum(chunk) / len(chunk)
            v = sum((x - m) ** 2 for x in chunk) / len(chunk)
            if v <= 0.0:
                v = 1.0
            self.means.append(m)
            self.variances.append(v)

        prev_log_likelihood = -float('inf')

        for iteration in range(self.max_iter):
            # --- E-Step: Compute responsibilities ---
            responsibilities = [] # matrix of size n x k
            for x in data:
                resps = []
                total = 0.0
                for k_idx in range(self.k):
                    p = self.weights[k_idx] * self._normal_pdf(x, self.means[k_idx], self.variances[k_idx])
                    resps.append(p)
                    total += p
                
                # Normalize responsibilities
                if total > 0.0:
                    resps = [p / total for p in resps]
                else:
                    resps = [1.0 / self.k] * self.k
                responsibilities.append(resps)

            # --- M-Step: Update parameters ---
            nk = [sum(responsibilities[i][k_idx] for i in range(n)) for k_idx in range(self.k)]
            
            for k_idx in range(self.k):
                if nk[k_idx] <= 1e-4:
                    # Reset component if it becomes empty
                    self.weights[k_idx] = 1.0 / self.k
                    self.means[k_idx] = random.choice(data)
                    self.variances[k_idx] = sum((x - self.means[k_idx])**2 for x in data) / n
                    continue

                self.weights[k_idx] = nk[k_idx] / n
                self.means[k_idx] = sum(responsibilities[i][k_idx] * data[i] for i in range(n)) / nk[k_idx]
                v = sum(responsibilities[i][k_idx] * ((data[i] - self.means[k_idx]) ** 2) for i in range(n)) / nk[k_idx]
                self.variances[k_idx] = max(v, 1e-4) # keep variance positive

            # Calculate log-likelihood
            log_likelihood = 0.0
            for x in data:
                p_sum = sum(self.weights[k_idx] * self._normal_pdf(x, self.means[k_idx], self.variances[k_idx]) for k_idx in range(self.k))
                if p_sum > 0.0:
                    log_likelihood += math.log(p_sum)

            if abs(log_likelihood - prev_log_likelihood) < self.tol:
                break
            prev_log_likelihood = log_likelihood

        return True
