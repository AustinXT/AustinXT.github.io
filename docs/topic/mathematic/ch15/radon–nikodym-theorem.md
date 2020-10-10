# Radon–Nikodym theorem

### Definition

In mathematics, the **Radon–Nikodym theorem** is a result in measure theory which states that, given a measurable space $$ (X,\Sigma)$$, if a σ-finite measure $$\nu $$ on $$(X,\Sigma )$$ is absolutely continuous with respect to a σ-finite measure μ on $$(X,\Sigma )$$, then there is a measurable function $$ f:X\rightarrow [ 0,\infty )$$, such that for any measurable subset $$ A\subset X$$, 

![](https://wikimedia.org/api/rest_v1/media/math/render/svg/d89508d4f8368d8d47ef131f6790a58cc9cc027d)

The function  $$f$$  is called the **Radon–Nikodym derivative**and denoted by $$\frac {d\nu }{d\mu }$$.

### Theoretical origin

The theorem is named after Johann Radon, who proved the theorem for the special case where the underlying space is $$R^N$$ in 1913, and for Otto Nikodym who proved the general case in 1930. In 1936 Hans Freudenthal further generalized the Radon–Nikodym theorem by proving the Freudenthal spectral theorem, a result in Riesz space theory, which contains the Radon–Nikodym theorem as a special case.

### Radon–Nikodym derivative

The function $$f$$  satisfying the above equality is *uniquely defined up to a $$μ$$-null set*, that is, if $$g$$ is another function which satisfies the same property, then $$f$$ = $$g$$  $$μ$$-almost everywhere. $$f$$  is commonly written $$ \scriptstyle {\frac {d\nu }{d\mu }} $$ and is called the **Radon–Nikodym derivative**. The chice of notation and the name of the function reflects the fact that the function is analogous to a derivative in calculus in the sense that it describes the rate of change of density of one measure with respect to another (the way the Jacobian determinant is used in multivariable integration). A similar theorem can be proven for signed and complex measures: namely, that if $$μ$$ is a nonnegative σ-finite measure, and $$ν$$ is a finite-valued signed or complex measure such that $$ν≪ μ$$, i.e. $$ν$$ is absolutely continuous with respect to $$μ$$, then there is a $$μ$$-integrable real- or complex-valued function $$g$$ on $$X$$ such that for every measurable set $$A$$,

![](https://wikimedia.org/api/rest_v1/media/math/render/svg/ac15142a795704f42b14a0b14c74c81b2c5d7ee5)

### Applications

The theorem is very important in extending the ideas of probability theory from probability masses and probability densities defined over real numbers to probability measures defined over arbitrary sets. It tells if and how it is possible to change from one probability measure to another. Specifically, the probability density function of a random variable is the Radon–Nikodym derivative of the induced measure with respect to some base measure (usually the Lebesgue measure for continuous random variables).

For example, it can be used to prove the existence of conditional expectation for probability measures. The latter itself is a key concept in probability theory, as conditional probability is just a special case of it.

Amongst other fields, financial mathematics uses the theorem extensively. Such changes of probability measure are the cornerstone of the rational pricing of derivatives and are used for converting actual probabilities into those of the risk neutral probabilities.

### Properties

- Let $$ν$$, $$μ$$, and $$λ$$ be $$σ$$-finite measures on the same measure space. If $$ν$$ ≪ $$λ$$ and $$μ$$ ≪ $$λ$$ ($$ν$$ and $$μ$$ are absolutely continuous with respect to $$λ$$, then

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/04d3c2ad8fb6c79cc3a095c3b79a9ce9953c6ea9)




- If $$ν ≪ μ ≪ λ$$, then

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/28c8cc3210c00e2b6d514372503f70181b23078e)




- In particular, if $$μ$$ ≪ $$ν$$ and $$ν$$ ≪ $$μ$$, then

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/66a78e0574a81ad5174ae1469877bfed12e4e8c3)




- If $$μ$$ ≪ $$λ$$ and g is a $$μ$$-integrable function, then

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/ec160d72a50718eef7b72f05b78c7e3be5576722)




- If $$ν$$ is a finite signed or complex measure, then

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/3520eabc052c1a5e71d7e07329cfe77a4be9925f)

### Further applications

Information divergences

If $$μ$$ and $$ν$$ are measures over $$X$$, and $$μ ≪ ν$$

- The Kullback–Leibler divergence from $$μ$$ to $$ν$$ is defined to be

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/46d22102a3e078b465dc863734a97d5029086af6)


- For $$α > 0$$, $$α ≠ 1$$ the Rényi divergence of order $$α$$ from $$μ$$ to $$ν$$ is defined to be

  ![](https://wikimedia.org/api/rest_v1/media/math/render/svg/bb7ae80e5f4e2d6e9013b60be25129e46b585a2a)

  ​

