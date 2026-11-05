# Separate read-only staging TTFB evidence

Nine browser samples used cold HTTP cache but a connection pool already authenticated on robots.txt. Zero DNS/TCP/TLS Navigation Timing values therefore describe reused connections, not free connection setup. The browser, viewport, actual LCP element, complete timing entries and noindex result are in [live-ttfb.json](live-ttfb.json). No infrastructure/backend change was made.

| Page | Response-wait min / median / max ms | Document TTFB median ms |
| --- | --- | ---: |
| /ru/product/56 | 678.4 / 1897.9 / 3016.8 | 1900.6 |
| /ru/catalog | 520.1 / 564.6 / 821.9 | 566.9 |
| /ru | 210.0 / 385.8 / 938.6 | 388.9 |

Browser request-start delay was 0.8–1.7ms; observed HTML download was 1.4–391.6ms and image LCP render-after-load was 13.0–92.8ms. All nine pages retained `noindex, nofollow`. The large response-wait variation remains unresolved: it can include network, edge, SSR/backend/data dependencies, and cannot be assigned to backend computation from these client samples alone.

Three additional curl processes created fresh TCP/TLS connections. Values below are phase differences, not cumulative curl timestamps; the OS may still cache DNS. These are separate samples, not a controlled browser before/after.

| Page | DNS ms | TCP before TLS ms | TLS ms | Wait after pretransfer ms | Download ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| /ru/product/56 | 22.5 | 187.5 | 213.5 | 3334.7 | 569.3 |
| /ru/catalog | 21.3 | 210.3 | 194.0 | 758.8 | 562.4 |
| /ru | 6.3 | 189.6 | 196.6 | 370.4 | 582.7 |

The local fixture buffers SSR responses through a loopback relay and has frozen in-process API data. Its document TTFB/LCP cannot be used as deployed staging timings. A separate investigation should correlate repeated live client timings with existing edge/application request timing before proposing any cache, backend, Nginx or infrastructure change. Such changes are outside this task.
