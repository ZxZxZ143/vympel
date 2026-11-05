# Paired local performance — not deployed results

Three identical page samples per row: home, product 56 and product 46. Normal is unthrottled loopback. Completed wire includes headers; partial/pending bytes are shown separately. Exact request records and actual LCP elements remain in comparison.json and request-ledger.json.

| Network / ECT | Width | Cache | Image requests B→A | Far carousel requests B→A | Completed wire bytes B→A | Partial wire B→A | Direct / 304 B→A | Pending B→A | Median LCP ms B→A | Max CLS B→A |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| normal / 3G | 390 | cold | 35 → 29 | 6 → 0 | 31,616,097 → 22,019,314 | 0 → 0 | 0 → 0 / 0 → 0 | 0 → 0 | 476.0 → 424.0 | 0.000053 → 0.000057 |
| normal / 3G | 390 | warm | 35 → 29 | 6 → 0 | 0 → 0 | 0 → 0 | 35 → 29 / 0 → 0 | 0 → 0 | 164.0 → 180.0 | 0.000011 → 0.000011 |
| normal / 3G | 1440 | cold | 47 → 41 | 6 → 0 | 44,410,831 → 34,490,453 | 0 → 0 | 0 → 0 / 0 → 0 | 0 → 0 | 380.0 → 428.0 | 0.000001 → 0.000001 |
| normal / 3G | 1440 | warm | 47 → 41 | 6 → 0 | 0 → 0 | 0 → 0 | 45 → 39 / 2 → 2 | 0 → 0 | 192.0 → 176.0 | 0.000001 → 0.000001 |
| normal / 4G | 390 | cold | 25 → 23 | 2 → 0 | 23,903,649 → 19,940,320 | 0 → 0 | 0 → 0 / 0 → 0 | 0 → 0 | 552.0 → 712.0 | 0.000056 → 0.000061 |
| normal / 4G | 390 | warm | 25 → 23 | 2 → 0 | 0 → 0 | 0 → 0 | 25 → 23 / 0 → 0 | 0 → 0 | 184.0 → 216.0 | 0.000015 → 0.000011 |
| normal / 4G | 1440 | cold | 24 → 24 | 0 → 0 | 20,328,991 → 20,328,991 | 0 → 0 | 0 → 0 / 0 → 0 | 0 → 0 | 484.0 → 592.0 | 0.000002 → 0.000002 |
| normal / 4G | 1440 | warm | 24 → 24 | 0 → 0 | 0 → 0 | 0 → 0 | 24 → 24 / 0 → 0 | 0 → 0 | 180.0 → 212.0 | 0.000002 → 0.000002 |
| slow / 3G | 390 | cold | 38 → 32 | 6 → 0 | 989,350 → 989,350 | 10,265,536 → 10,285,812 | 0 → 0 / 0 → 0 | 16 → 10 | 5024.0 → 5028.0 | 0.000257 → 0.000093 |
| slow / 3G | 390 | warm | 37 → 33 | 6 → 0 | 195,351 → 195,351 | 0 → 0 | 36 → 32 / 0 → 0 | 0 → 0 | 260.0 → 276.0 | 0.000089 → 0.000080 |
| slow / 3G | 1440 | cold | 50 → 43 | 6 → 0 | 1,334,969 → 2,460,015 | 14,978,744 → 13,832,692 | 1 → 0 / 0 → 0 | 24 → 17 | 2700.0 → 2604.0 | 0.000196 → 0.000196 |
| slow / 3G | 1440 | warm | 51 → 45 | 6 → 0 | 2,096,307 → 0 | 854,276 → 0 | 46 → 43 / 2 → 2 | 1 → 0 | 256.0 → 232.0 | 0.000011 → 0.000012 |
| slow / 4G | 390 | cold | 28 → 26 | 2 → 0 | 700,481 → 700,481 | 10,442,536 → 10,438,812 | 0 → 0 / 0 → 0 | 12 → 10 | 5228.0 → 5312.0 | 0.000082 → 0.000096 |
| slow / 4G | 390 | warm | 28 → 27 | 2 → 0 | 0 → 0 | 0 → 0 | 28 → 27 / 0 → 0 | 0 → 0 | 260.0 → 276.0 | 0.000089 → 0.000103 |
| slow / 4G | 1440 | cold | 27 → 26 | 0 → 0 | 731,859 → 731,859 | 10,367,536 → 10,367,536 | 1 → 0 / 0 → 0 | 10 → 10 | 3188.0 → 3164.0 | 0.000196 → 0.000196 |
| slow / 4G | 1440 | warm | 29 → 29 | 0 → 0 | 0 → 0 | 0 → 0 | 29 → 29 / 0 → 0 | 0 → 0 | 244.0 → 244.0 | 0.000011 → 0.000011 |

Far/eligible classification uses the final styled initial carousel range plus one neighbour and four SSR bootstrap identities, matching the independent network gate. There is no carousel navigation during cold/warm windows. Request-time visibility separately uses 200ms DOM samples and is approximate: early samples can be in a hidden Next stream or before CSS; their layout width is retained. They must not redefine the final horizontal bound or be described as sub-frame visibility measurements. Pages remain at their initial carousel position throughout these windows.
