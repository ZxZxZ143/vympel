# Bounded next-navigation observations

Same configured network as the matched page run. Scroll into view, dwell 1.8 seconds, then press Right. Image-ready delay is separate from the 700ms settling/polling floor. Pending at the 15-second cutoff is not zero delay. Decoding cleanup after the cutoff is unthrottled and excluded.

| Page | Width | ECT / network | Image delay ms B→A | Pending B→A |
| --- | ---: | --- | --- | --- |
| /ru/product/46 | 1440 | 3G / normal | 0 → 0 | False → False |
| /ru/product/56 | 1440 | 3G / normal | 0 → 0 | False → False |
| /ru | 1440 | 3G / normal | 0 → 0 | False → False |
| /ru/product/46 | 390 | 3G / normal | 0 → 0 | False → False |
| /ru/product/56 | 390 | 3G / normal | 0 → 0 | False → False |
| /ru | 390 | 3G / normal | 0 → 0 | False → False |
| /ru/product/46 | 1440 | 3G / slow | 0 → 0 | False → False |
| /ru/product/56 | 1440 | 3G / slow | 0 → 0 | False → False |
| /ru | 1440 | 3G / slow | 0 → 0 | False → False |
| /ru/product/46 | 390 | 3G / slow | None → None | True → True |
| /ru/product/56 | 390 | 3G / slow | None → None | True → True |
| /ru | 390 | 3G / slow | 0 → 0 | False → False |
| /ru/product/46 | 1440 | 4G / normal | 0 → 0 | False → False |
| /ru/product/56 | 1440 | 4G / normal | 0 → 0 | False → False |
| /ru | 1440 | 4G / normal | 0 → 0 | False → False |
| /ru/product/46 | 390 | 4G / normal | 0 → 0 | False → False |
| /ru/product/56 | 390 | 4G / normal | 0 → 0 | False → False |
| /ru | 390 | 4G / normal | 0 → 0 | False → False |
| /ru/product/46 | 1440 | 4G / slow | None → None | True → True |
| /ru/product/56 | 1440 | 4G / slow | None → None | True → True |
| /ru | 1440 | 4G / slow | 0 → 0 | False → False |
| /ru/product/46 | 390 | 4G / slow | None → None | True → True |
| /ru/product/56 | 390 | 4G / slow | None → None | True → True |
| /ru | 390 | 4G / slow | 0 → 0 | False → False |
