# Recipe Economy Report

One fully staffed facility, local input purchases, local output sales, normal market diffusion, and repairs at 70% condition. Initial margin is a full-cycle initial-market rate including expected maintenance; it does not treat input purchase timing as a loss.

## Recipe windows

Each recipe is assessed in a base market and a Network III market with Local Market Network III and Market Diffusion Network III already owned. The Network III scenario measures recipe resilience; its research is pre-owned and is not charged to facility payback. When electricity max 1.5x changes a margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first completed output cycle with a non-positive margin, so a later recovery remains possible.

## Animal Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Raise Cattle | Base market | 1105.00/131.00 | 15.67 | 13.09/9.69/6.82 | 3.15/31.5% | 68.02 | not reached | 161 |
| Raise Cattle | Network III | 1105.00/131.00 | 15.67 | 13.87/11.26/8.44 | 2.35/23.5% | 68.02 | not reached | 121 |
| Raise Chicken | Base market | 1105.00/170.00 | 24.68 | 20.98/15.95/11.21 | 2.59/25.9% | 57.03 | not reached | 74 |
| Raise Chicken | Network III | 1105.00/170.00 | 24.68 | 22.18/18.22/13.23 | 1.94/19.4% | 57.03 | not reached | 61 |
| Raise Sheep | Base market | 1105.00/150.00 | 23.99 | 20.78/16.61/12.53 | 3.16/31.6% | 62.78 | not reached | 69 |
| Raise Sheep | Network III | 1105.00/150.00 | 23.99 | 21.69/18.49/14.38 | 2.37/23.7% | 62.78 | not reached | 60 |

## Assembly Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assemble Industrial Machines | Base market | 8030.00/320.00 | 139.67 | 65.25/22.34/-12.80 | 59.26/39.5% | 791.34 | 2 | not reached |
| Assemble Industrial Machines | Network III | 8030.00/320.00 | 139.67 | 84.33/52.35/20.38 | 47.99/32.0% | 840.87 | 2 | not reached |

## Bakery

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bake Bread | Base market | 2660.00/167.00 | 43.11 | 38.57/31.11/22.52 | 0.72/30.0% | 134.47 | not reached | 97 |
| Bake Bread | Network III | 2660.00/167.00 | 43.11 | 40.02/34.30/25.78 | 0.54/22.5% | 134.47 | not reached | 83 |
| Bake Cake | Base market | 2660.00/212.00 | 78.21 | 52.40/28.96/15.27 | 4.81/68.8% | 138.00 | not reached | 167 |
| Bake Cake | Network III | 2660.00/212.00 | 78.21 | 60.88/39.97/23.20 | 4.29/61.3% | 138.00 | not reached | 73 |
| Bake Meat Pie | Base market | 2660.00/254.00 | 37.93 | 21.19/2.50/-5.90 | 5.00/62.6% | 148.33 | 26 | not reached |
| Bake Meat Pie | Network III | 2660.00/254.00 | 37.93 | 27.25/12.86/2.43 | 4.32/54.1% | 148.33 | 62 | not reached |
| Bake Premium Cake | Base market | 2660.00/283.00 | 95.69 | 67.39/37.42/19.12 | 7.54/62.8% | 143.04 | not reached | 94 |
| Bake Premium Cake | Network III | 2660.00/283.00 | 95.69 | 76.93/52.19/30.79 | 6.53/54.5% | 143.04 | not reached | 47 |

## Chemical Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Chemicals | Base market | 4240.00/198.00 | 28.93 | 20.83/12.39/7.34 | 5.74/57.4% | 370.02 | not reached | not reached |
| Produce Chemicals | Network III | 4240.00/198.00 | 28.93 | 23.23/15.99/10.67 | 4.88/48.8% | 370.02 | not reached | not reached |
| Produce Plastic | Base market | 4240.00/235.00 | 28.65 | 9.73/-9.94/-19.89 | 9.16/61.1% | 340.83 | 15 | not reached |
| Produce Plastic | Network III | 4240.00/235.00 | 28.65 | 16.68/2.08/-9.25 | 7.95/53.0% | 340.83 | 29 | not reached |
| Synthesize Fertilizer | Base market | 4240.00/240.00 | 20.87 | 9.74/-0.55/-6.66 | 6.43/64.3% | 356.99 | 21 | not reached |
| Synthesize Fertilizer | Network III | 4240.00/240.00 | 20.87 | 13.56/5.07/-1.46 | 5.62/56.2% | 356.99 | 48 | not reached |

## Construction Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Bricks | Base market | 3280.00/194.00 | 54.99 | 12.22/2.05/-1.03 | 1.23/81.7% | 208.00 | 19 | not reached |
| Produce Bricks | Network III | 3280.00/194.00 | 54.99 | 20.95/7.59/2.86 | 1.16/77.5% | 208.00 | 153 | not reached |
| Produce Cement | Base market | 3280.00/241.00 | 47.28 | 22.04/2.62/-6.39 | 3.46/76.9% | 243.16 | 25 | not reached |
| Produce Cement | Network III | 3280.00/241.00 | 47.28 | 30.15/12.36/1.04 | 3.14/69.9% | 243.16 | 59 | not reached |
| Produce Construction Materials | Base market | 3280.00/376.00 | 41.08 | 22.23/6.12/-5.52 | 14.25/83.8% | 195.31 | 38 | not reached |
| Produce Construction Materials | Network III | 3280.00/376.00 | 41.08 | 27.46/13.97/1.88 | 12.80/75.3% | 217.28 | 82 | not reached |
| Produce Reinforced Concrete | Base market | 3280.00/343.00 | 116.33 | 64.41/22.21/-2.55 | 18.20/82.7% | 282.98 | 46 | not reached |
| Produce Reinforced Concrete | Network III | 3280.00/343.00 | 116.33 | 79.83/41.66/13.55 | 16.67/75.8% | 282.98 | 116 | not reached |

## Electronics Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Advanced Components | Base market | 5350.00/286.00 | 131.12 | 87.51/53.51/30.34 | 32.67/32.7% | 452.08 | 228 | 169 |
| Produce Advanced Components | Network III | 5350.00/286.00 | 131.12 | 98.58/74.12/50.46 | 26.59/26.6% | 452.08 | not reached | 82 |
| Produce Silicon | Base market | 5350.00/211.00 | 37.71 | 27.01/16.72/9.38 | 14.37/59.9% | 413.59 | not reached | not reached |
| Produce Silicon | Network III | 5350.00/211.00 | 37.71 | 29.93/21.59/14.02 | 12.13/50.6% | 413.59 | not reached | not reached |

## Farm

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grow Fruit | Base market | 295.00/124.00 | 9.50 | 8.11/6.65/5.40 | 0.12/13.4% | 14.15 | not reached | 43 |
| Grow Fruit | Network III | 295.00/124.00 | 9.50 | 8.59/7.36/5.98 | 0.09/10.1% | 14.15 | not reached | 38 |
| Grow Grain | Base market | 295.00/108.00 | 2.81 | 0.03/-1.45/-1.57 | 0.13/15.7% | 15.96 | 7 | not reached |
| Grow Grain | Network III | 295.00/108.00 | 2.81 | 1.10/-0.13/-0.47 | 0.09/11.6% | 15.96 | 17 | not reached |
| Grow Sugar | Base market | 295.00/104.00 | 1.02 | 0.04/-0.77/-0.87 | 0.05/6.9% | 14.50 | 9 | not reached |
| Grow Sugar | Network III | 295.00/104.00 | 1.02 | 0.44/-0.15/-0.34 | 0.04/5.2% | 14.50 | 18 | not reached |

## Industrial Processing Factory

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electric Circuits | Base market | 2130.00/219.00 | 95.73 | 69.39/38.86/19.17 | 6.16/24.6% | 173.28 | 230 | 49 |
| Produce Electric Circuits | Network III | 2130.00/219.00 | 95.73 | 77.67/56.00/36.99 | 4.80/19.2% | 173.28 | not reached | 31 |
| Produce Steel | Base market | 2130.00/172.00 | 35.02 | 18.12/1.92/-7.27 | 5.03/71.8% | 159.36 | 25 | not reached |
| Produce Steel | Network III | 2130.00/172.00 | 35.02 | 23.81/10.63/0.26 | 4.42/63.2% | 159.36 | 61 | not reached |

## Mine

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mine Coal | Base market | 715.00/89.00 | 35.06 | 16.98/6.53/2.05 | 1.41/78.6% | 50.47 | 135 | not reached |
| Mine Coal | Network III | 715.00/89.00 | 35.06 | 22.51/11.49/5.53 | 1.30/72.5% | 50.47 | not reached | 66 |
| Mine Copper | Base market | 715.00/135.00 | 17.31 | 8.40/1.79/-1.58 | 2.39/47.8% | 53.57 | 31 | not reached |
| Mine Copper | Network III | 715.00/135.00 | 17.31 | 11.60/5.85/2.07 | 1.99/39.9% | 53.57 | 133 | not reached |
| Mine Gold | Base market | 715.00/131.00 | 36.41 | 26.02/16.32/10.51 | 43.70/54.6% | 56.57 | not reached | 36 |
| Mine Gold | Network III | 715.00/131.00 | 36.41 | 29.45/20.93/14.59 | 36.85/46.1% | 56.57 | not reached | 28 |
| Mine Iron | Base market | 715.00/94.00 | 20.19 | 9.05/0.40/-3.91 | 2.56/56.9% | 51.83 | 22 | not reached |
| Mine Iron | Network III | 715.00/94.00 | 20.19 | 13.03/5.52/0.56 | 2.19/48.7% | 51.83 | 67 | not reached |

## Power Plant

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coal Power | Base market | 2150.00/128.00 | 6.04 | 2.19/0.50/-0.49 | 0.11/27.5% | 184.17 | 31 | not reached |
| Coal Power | Network III | 2150.00/128.00 | 6.04 | 3.40/1.91/0.88 | 0.09/23.0% | 184.17 | 127 | not reached |
| Solar Power | Base market | 2150.00/100.00 | 0.89 | 0.62/0.48/0.36 | 0.04/10.0% | 146.59 | 103 | not reached |
| Solar Power | Network III | 2150.00/100.00 | 0.89 | 0.70/0.56/0.43 | 0.03/7.7% | 146.59 | 103 | not reached |

## Quarry

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quarry Clay | Base market | 1305.00/104.00 | 8.79 | 6.38/4.17/3.09 | 0.18/22.6% | 67.86 | not reached | not reached |
| Quarry Clay | Network III | 1305.00/104.00 | 8.79 | 7.27/5.43/4.05 | 0.14/17.5% | 67.86 | not reached | not reached |
| Quarry Minerals | Base market | 1305.00/144.00 | 19.79 | 11.10/6.25/4.52 | 0.40/40.3% | 67.86 | not reached | not reached |
| Quarry Minerals | Network III | 1305.00/144.00 | 19.79 | 14.03/9.19/6.65 | 0.34/33.6% | 67.86 | not reached | 196 |
| Quarry Sand | Base market | 1305.00/84.00 | 9.29 | 4.63/1.16/0.16 | 0.18/44.2% | 66.31 | 32 | not reached |
| Quarry Sand | Network III | 1305.00/84.00 | 9.29 | 6.32/3.16/1.61 | 0.15/37.4% | 66.31 | not reached | not reached |
| Quarry Stone | Base market | 1305.00/124.00 | 31.04 | 18.62/9.70/6.25 | 0.95/47.5% | 70.55 | not reached | 238 |
| Quarry Stone | Network III | 1305.00/124.00 | 31.04 | 22.99/14.65/9.87 | 0.79/39.6% | 70.55 | not reached | 115 |

## Small Utility Works

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electricity | Base market | 635.00/74.00 | 7.46 | 6.27/5.61/4.68 | 0.06/15.2% | 30.70 | not reached | 126 |
| Produce Electricity | Network III | 635.00/74.00 | 7.46 | 6.63/5.95/4.94 | 0.05/12.2% | 30.70 | not reached | 117 |
| Produce Water | Base market | 635.00/53.00 | 2.55 | 2.07/1.63/1.31 | 0.03/28.9% | 26.32 | not reached | not reached |
| Produce Water | Network III | 635.00/53.00 | 2.55 | 2.24/1.85/1.48 | 0.02/23.1% | 26.32 | not reached | not reached |

## Water Well

Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.

| recipe | scenario | Facility/recipe cost (EUR) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Electric Pumping | Base market | 550.00/91.00 | 2.30 | 0.41/-0.55/-0.65 | 0.04/42.8% | 25.40 | 10 | not reached |
| Electric Pumping | Network III | 550.00/91.00 | 2.30 | 1.06/0.10/-0.17 | 0.04/36.2% | 25.40 | 23 | not reached |
| Manual Pumping | Base market | 550.00/46.00 | 2.62 | 2.13/1.69/1.36 | 0.03/28.9% | 22.80 | not reached | not reached |
| Manual Pumping | Network III | 550.00/46.00 | 2.62 | 2.30/1.90/1.53 | 0.02/23.1% | 22.80 | not reached | not reached |

## Connected-chain economy (180 minutes)

Each row runs all listed facilities in one shared base market. Upstream production is available to downstream facilities before each minute ends; the chain retains the following minute's required inputs and sells every other produced good. When electricity max 1.5x changes a margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first output minute with a non-positive margin, so a later recovery remains possible. Setup cost includes land, Construction Materials, Industrial Machines, and each distinct recipe-unlock research cost. Construction demand consumes the participating facilities' total Construction Materials and Industrial Machines requirement evenly through the 180-minute scenario; it is external demand, not a player expense. A scenario that stalls a facility is treated as an invalid report scenario.

| chain | primary output | facilities | setup cost (EUR) | market input cost (EUR) | margin 15m/60m/180m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Staples: utilities -> Farm | Grain, Sugar | Small Utility Works x2, Farm x2 | 2199.00 | 1751.10 | 10.50/8.10/6.10 | not reached | not reached |
| Extraction: utilities -> Mine | Coal, Iron, Copper | Small Utility Works x2, Mine x3 | 3860.00 | 8226.56 | 40.86/13.66/-1.54<br>Electricity max 1.5x: 41.63/14.72/0.47 | 46 | not reached |
| Fertilizer bridge: quarry -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2 | 12566.00 | 2239.89 | 42.70/-3.76/-86.86 | 40 | not reached |
| Fertilizer bridge: market inputs -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Chemical Plant x1, Farm x2 | 6679.00 | 3163.32 | -2.02/-9.70/-3.05 | 68 | not reached |
| Fertilizer: quarry -> Fertilizer | Fertilizer | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 11764.00 | 355.25 | 41.61/-14.45/-75.33 | 40 | not reached |
| Plastic: quarry -> Plastic | Plastic | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 11759.00 | 480.34 | 46.45/-9.20/-70.50 | 41 | not reached |
| Steel: mines -> Steel | Steel | Small Utility Works x2, Mine x2, Industrial Processing Factory x1 | 5312.00 | 4617.15 | 51.92/28.26/12.63<br>Electricity max 1.5x: 51.92/28.26/12.95 | 123 | not reached |
| Poultry -> Cake | Cake | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 16314.00 | 2639.81 | 113.40/60.95/-270.14 | 40 | not reached |
| Cattle -> Meat Pie | Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 16317.00 | 3808.89 | 75.43/32.57/-298.21 | 34 | not reached |
| Animal farm and bakery: inputs -> Cake, Premium Cake, and Meat Pie | Cake, Premium Cake, Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2, Animal Farm x3, Bakery x3 | 25081.00 | 5354.63 | 239.00/156.06/-135.03<br>Electricity max 1.5x: 239.40/156.69/-134.59 | 26 | not reached |
| Construction: inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Mine x2, Quarry x3, Industrial Processing Factory x1, Construction Factory x4 | 25335.00 | 16041.04 | 235.85/231.56/132.52<br>Electricity max 1.5x: 252.22/250.03/152.49 | 1 | not reached |
| Industrial Machines: inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Quarry x2, Chemical Plant x2, Mine x4, Electronics Factory x2, Industrial Processing Factory x2, Assembly Plant x1 | 42177.00 | 25971.85 | 597.30/374.91/-85.05<br>Electricity max 1.5x: 633.67/412.85/-43.19 | 1 | not reached |
| Construction Materials: market inputs -> Construction Materials | Construction Materials | Water Well x1, Power Plant x1, Construction Factory x1 | 6575.00 | 4559.16 | 219.02/24.29/-0.62 | 1 | not reached |
| Industrial Machines: market inputs -> Industrial Machines | Industrial Machines | Water Well x1, Power Plant x1, Assembly Plant x1 | 11269.00 | 21738.16 | 98.36/-565.37/19.35 | 1 | 192 |

