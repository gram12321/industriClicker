# Recipe Economy Report

One fully staffed facility, local input purchases, normal market diffusion, assigned-staff wages, and repairs at 70% condition. Initial margin is a full-cycle initial-market rate including expected maintenance and wages; it does not treat input purchase timing as a loss.

## Recipe windows

Each recipe is assessed in the base market. The facility is fully staffed, and all assigned-worker wages are included in every margin and payback calculation. Every margin cell also shows Generated orders max 25%: a comparison that uses the live deterministic customer catalogue, generated bids, and standard lots, but fulfils no more than 25% of each recipe output. It is not guaranteed demand. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first completed output cycle with a non-positive margin, measured through the 24-hour report horizon.

## Facility investment and recipe resilience

Building cost is the initial-price construction cost: land plus Construction Materials and Industrial Machines. The unprofitable window is searched through the 24-hour report horizon.

| facility | recipe | total building cost (EUR) | building cost (EUR/CM/IM) | initial margin | window till unprofitable |
| --- | --- | --- | --- | --- | --- |
| Animal Farm | Raise Cattle | 892.50 | 80/25/4 | 12.57 | 515 |
| Animal Farm | Raise Chicken | 892.50 | 80/25/4 | 19.70 | 1242 |
| Animal Farm | Raise Sheep | 892.50 | 80/25/4 | 19.39 | not reached in 24h |
| Assembly Plant | Assemble Industrial Machines | 6330.00 | 130/200/30 | 191.28 | 1031 |
| Bakery | Bake Bread | 990.00 | 50/40/4 | 39.15 | not reached in 24h |
| Bakery | Bake Cake | 990.00 | 50/40/4 | 71.59 | 505 |
| Bakery | Bake Meat Pie | 990.00 | 50/40/4 | 93.72 | 60 |
| Bakery | Bake Premium Cake | 990.00 | 50/40/4 | 41.63 | 186 |
| Chemical Plant | Produce Chemicals | 3950.00 | 100/100/20 | 12.54 | 62 |
| Chemical Plant | Produce Plastic | 3950.00 | 100/100/20 | 27.87 | 32 |
| Chemical Plant | Synthesize Fertilizer | 3950.00 | 100/100/20 | 26.97 | 47 |
| Coal Power Plant | Coal Power | 6030.00 | 100/80/35 | 2.22 | 3 |
| Construction Factory | Produce Bricks | 2430.00 | 80/100/10 | 45.98 | 31 |
| Construction Factory | Produce Cement | 2430.00 | 80/100/10 | 47.05 | 55 |
| Construction Factory | Produce Construction Materials | 2430.00 | 80/100/10 | -2.29 | 3 |
| Construction Factory | Produce Reinforced Concrete | 2430.00 | 80/100/10 | 73.24 | 123 |
| Electronics Factory | Produce Advanced Components | 4075.00 | 100/150/18 | 90.46 | 1428 |
| Electronics Factory | Produce Silicon | 4075.00 | 100/150/18 | 22.37 | 154 |
| Farm | Grow Fruit | 252.50 | 60/5/1 | 5.67 | not reached in 24h |
| Farm | Grow Grain | 252.50 | 60/5/1 | 9.76 | 187 |
| Farm | Grow Sugar | 252.50 | 60/5/1 | 2.08 | 8 |
| Industrial Processing Factory | Produce Electric Circuits | 1705.00 | 80/50/8 | 63.93 | not reached in 24h |
| Industrial Processing Factory | Produce Steel | 1705.00 | 80/50/8 | 33.68 | 50 |
| Mine | Mine Coal | 672.50 | 30/5/4 | 21.27 | 67 |
| Mine | Mine Copper | 672.50 | 30/5/4 | 7.96 | 17 |
| Mine | Mine Gold | 672.50 | 30/5/4 | 22.29 | 161 |
| Mine | Mine Iron | 672.50 | 30/5/4 | 10.12 | 16 |
| Quarry | Quarry Clay | 665.00 | 25/40/2 | 4.58 | 124 |
| Quarry | Quarry Minerals | 665.00 | 25/40/2 | 13.52 | 648 |
| Quarry | Quarry Sand | 665.00 | 25/40/2 | 4.97 | 36 |
| Quarry | Quarry Stone | 665.00 | 25/40/2 | 22.67 | 600 |
| Small Utility Works | Produce Electricity | 592.50 | 100/5/3 | 6.49 | not reached in 24h |
| Small Utility Works | Produce Water | 592.50 | 100/5/3 | 1.59 | 218 |
| Solar Plant | Solar Power | 1555.00 | 100/30/8 | -0.71 | 1 |
| Water Well | Electric Pumping | 1530.00 | 100/80/5 | 6.92 | 205 |
| Water Well | Manual Pumping | 1530.00 | 100/80/5 | 0.91 | 49 |

## Animal Farm

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Raise Cattle | Base market | 892.50/131.00 | 892.50 | 80/25/4 | 12.57 | 10.32/7.56/4.75<br>Generated orders max 25%: 5.70/5.42/2.68 | 2.57/25.7% | 49.60 | 120.00 | 515 | 189 |
| Raise Chicken | Base market | 892.50/170.00 | 892.50 | 80/25/4 | 19.70 | 16.52/12.42/8.27<br>Generated orders max 25%: 11.04/9.62/5.87 | 2.27/22.7% | 41.82 | 120.00 | 1242 | 78 |
| Raise Sheep | Base market | 892.50/150.00 | 892.50 | 80/25/4 | 19.39 | 16.59/13.17/9.07<br>Generated orders max 25%: 10.52/9.68/6.05 | 2.51/25.1% | 45.81 | 120.00 | not reached in 24h | 72 |

## Assembly Plant

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assemble Industrial Machines | Base market | 6330.00/320.00 | 6330.00 | 130/200/30 | 191.28 | 111.90/72.07/48.87<br>Generated orders max 25%: 50.68/36.85/19.06 | 53.57/35.7% | 422.36 | 720.00 | 1031 | 111 |

## Bakery

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bake Bread | Base market | 990.00/122.00 | 990.00 | 50/40/4 | 39.15 | 34.92/27.57/19.51<br>Generated orders max 25%: 23.95/21.13/14.25 | 0.66/27.4% | 47.07 | 120.00 | not reached in 24h | 32 |
| Bake Cake | Base market | 990.00/167.00 | 990.00 | 50/40/4 | 71.59 | 48.27/26.93/14.14<br>Generated orders max 25%: 35.29/22.28/10.96 | 4.61/65.9% | 48.39 | 120.00 | 505 | 24 |
| Bake Meat Pie | Base market | 990.00/212.00 | 990.00 | 50/40/4 | 93.72 | 50.42/19.61/5.40<br>Generated orders max 25%: 35.39/13.36/1.62 | 5.67/70.9% | 51.17 | 120.00 | 60 | 27 |
| Bake Premium Cake | Base market | 990.00/238.00 | 990.00 | 50/40/4 | 41.63 | 75.40/40.45/16.26<br>Generated orders max 25%: 54.26/31.66/11.51 | 3.64/52.1% | 50.12 | 120.00 | 186 | 13 |

## Chemical Plant

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Chemicals | Base market | 3950.00/188.00 | 3950.00 | 100/100/20 | 12.54 | 8.32/5.20/1.61<br>Generated orders max 25%: 2.95/1.07/0.82 | 3.25/32.5% | 264.35 | 420.00 | 62 | not reached |
| Produce Plastic | Base market | 3950.00/224.00 | 3950.00 | 100/100/20 | 27.87 | 17.73/7.76/-0.13<br>Generated orders max 25%: 5.60/4.94/-3.95 | 5.86/39.1% | 241.05 | 420.00 | 32 | not reached |
| Synthesize Fertilizer | Base market | 3950.00/227.00 | 3950.00 | 100/100/20 | 26.97 | 19.17/9.56/2.23<br>Generated orders max 25%: 9.18/7.31/-0.48 | 4.74/47.4% | 252.87 | 420.00 | 47 | not reached |

## Coal Power Plant

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coal Power | Base market | 6030.00/143.00 | 6030.00 | 100/80/35 | 2.22 | -2.24/-4.27/-5.82<br>Generated orders max 25%: -6.18/-4.94/-7.44 | 0.08/19.8% | 376.79 | 540.00 | 3 | not reached |

## Construction Factory

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Bricks | Base market | 2430.00/194.00 | 2430.00 | 80/100/10 | 45.98 | 16.14/4.71/0.56<br>Generated orders max 25%: 9.79/4.81/-0.72 | 0.89/59.1% | 118.96 | 480.00 | 31 | not reached |
| Produce Cement | Base market | 2430.00/266.00 | 2430.00 | 80/100/10 | 47.05 | 29.41/12.78/2.56<br>Generated orders max 25%: 16.95/9.34/-0.32 | 2.60/57.8% | 138.60 | 480.00 | 55 | not reached |
| Produce Construction Materials | Base market | 2430.00/376.00 | 2430.00 | 80/100/10 | -2.29 | -6.72/-7.47/-9.76<br>Generated orders max 25%: -11.84/-5.22/-10.14 | 3.89/45.8% | 155.66 | 480.00 | 3 | not reached |
| Produce Reinforced Concrete | Base market | 2430.00/343.00 | 2430.00 | 80/100/10 | 73.24 | 47.89/29.32/11.42<br>Generated orders max 25%: 29.68/24.80/7.29 | 13.74/62.5% | 161.99 | 480.00 | 123 | not reached |

## Electronics Factory

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Advanced Components | Base market | 4075.00/286.00 | 4075.00 | 100/150/18 | 90.46 | 58.73/46.27/32.60<br>Generated orders max 25%: 28.46/29.83/16.06 | 26.77/26.8% | 277.47 | 360.00 | 1428 | 111 |
| Produce Silicon | Base market | 4075.00/211.00 | 4075.00 | 100/150/18 | 22.37 | 17.42/12.08/6.64<br>Generated orders max 25%: 9.57/10.30/3.91 | 8.13/33.9% | 252.32 | 360.00 | 154 | not reached |

## Farm

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grow Fruit | Base market | 252.50/124.00 | 252.50 | 60/5/1 | 5.67 | 4.49/3.35/2.44<br>Generated orders max 25%: 1.84/2.41/1.04 | 0.11/12.1% | 11.46 | 60.00 | not reached in 24h | 82 |
| Grow Grain | Base market | 252.50/108.00 | 252.50 | 60/5/1 | 9.76 | 4.50/1.78/0.76<br>Generated orders max 25%: -0.94/-1.40/-2.39 | 0.15/18.5% | 13.09 | 60.00 | 187 | not reached |
| Grow Sugar | Base market | 252.50/103.00 | 252.50 | 60/5/1 | 2.08 | 0.02/-1.37/-1.79<br>Generated orders max 25%: -3.14/-2.47/-3.46 | 0.09/12.2% | 12.23 | 60.00 | 8 | not reached |

## Industrial Processing Factory

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electric Circuits | Base market | 1705.00/219.00 | 1705.00 | 80/50/8 | 63.93 | 45.49/34.89/23.89<br>Generated orders max 25%: 20.83/24.74/11.03 | 4.57/18.3% | 111.18 | 360.00 | not reached in 24h | 45 |
| Produce Steel | Base market | 1705.00/171.00 | 1705.00 | 80/50/8 | 33.68 | 21.42/9.06/0.70<br>Generated orders max 25%: 10.23/6.52/-2.10 | 3.69/52.7% | 101.37 | 360.00 | 50 | not reached |

## Mine

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mine Coal | Base market | 672.50/89.00 | 672.50 | 30/5/4 | 21.27 | 13.41/5.91/1.72<br>Generated orders max 25%: 7.84/4.43/0.29 | 0.93/51.9% | 37.70 | 300.00 | 67 | not reached |
| Mine Copper | Base market | 672.50/135.00 | 672.50 | 30/5/4 | 7.96 | 3.01/-1.10/-2.92<br>Generated orders max 25%: -2.33/-2.97/-4.90 | 1.81/36.1% | 40.27 | 300.00 | 17 | not reached |
| Mine Gold | Base market | 672.50/131.00 | 672.50 | 30/5/4 | 22.29 | 15.94/9.15/4.67<br>Generated orders max 25%: 9.14/7.63/2.64 | 35.27/44.1% | 42.80 | 300.00 | 161 | 101 |
| Mine Iron | Base market | 672.50/94.00 | 672.50 | 30/5/4 | 10.12 | 3.79/-1.52/-3.77<br>Generated orders max 25%: -1.84/-1.99/-5.11 | 1.96/43.5% | 38.86 | 300.00 | 16 | not reached |

## Quarry

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quarry Clay | Base market | 665.00/104.00 | 665.00 | 25/40/2 | 4.58 | 3.42/2.13/0.99<br>Generated orders max 25%: 0.57/1.56/-0.27 | 0.08/10.3% | 30.05 | 180.00 | 124 | not reached |
| Quarry Minerals | Base market | 665.00/144.00 | 665.00 | 25/40/2 | 13.52 | 9.49/6.21/4.14<br>Generated orders max 25%: 4.83/4.51/2.01 | 0.21/21.4% | 30.05 | 180.00 | 648 | 148 |
| Quarry Sand | Base market | 665.00/84.00 | 665.00 | 25/40/2 | 4.97 | 2.91/0.79/-0.38<br>Generated orders max 25%: 0.01/0.53/-1.32 | 0.10/25.6% | 29.29 | 180.00 | 36 | not reached |
| Quarry Stone | Base market | 665.00/124.00 | 665.00 | 25/40/2 | 22.67 | 14.35/7.52/4.30<br>Generated orders max 25%: 8.08/5.23/1.95 | 0.76/37.9% | 31.24 | 180.00 | 600 | 134 |

## Small Utility Works

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Produce Electricity | Base market | 592.50/74.00 | 592.50 | 100/5/3 | 6.49 | 5.70/5.01/3.95<br>Generated orders max 25%: 3.99/4.73/3.11 | 0.03/8.0% | 28.26 | 60.00 | not reached in 24h | 139 |
| Produce Water | Base market | 592.50/53.00 | 592.50 | 100/5/3 | 1.59 | 1.27/0.88/0.52<br>Generated orders max 25%: 0.64/0.38/0.63 | 0.02/17.2% | 24.22 | 60.00 | 218 | not reached |

## Solar Plant

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Solar Power | Base market | 1555.00/70.00 | 1555.00 | 100/30/8 | -0.71 | -0.76/-0.79/-0.89<br>Generated orders max 25%: -1.09/-1.11/-1.16 | 0.01/1.8% | 64.19 | 60.00 | 1 | not reached |

## Water Well

The recipe rows use the base market and a 24-hour window for detecting the first completed output cycle with a non-positive operating margin.

| recipe | scenario | Facility/recipe cost (EUR) | Building cost (EUR) | Building cost (EUR/CM/IM) | initial margin | margin 15m/60m/180m | output price drop at 180m EUR/percent | maintenance 60m | staff wages 60m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Electric Pumping | Base market | 1530.00/136.00 | 1530.00 | 100/80/5 | 6.92 | 4.19/2.42/1.54<br>Generated orders max 25%: 2.48/2.78/1.14 | 0.04/38.5% | 69.83 | 60.00 | 205 | not reached |
| Manual Pumping | Base market | 1530.00/91.00 | 1530.00 | 100/80/5 | 0.91 | 0.60/0.24/-0.07<br>Generated orders max 25%: -0.03/-0.26/0.04 | 0.02/17.2% | 62.62 | 60.00 | 49 | not reached |

## Connected-chain economy (180 minutes)

Each row runs all listed facilities in one shared base market. Upstream production is available to downstream facilities before each minute ends; the chain retains the following minute's required inputs and sells every other produced good. Every fully staffed facility pays its assigned-worker wages in every margin and payback calculation. Every margin cell also shows Generated orders max 25%: real generated customer orders may fulfil only from the chain's named primary outputs, up to 25% of their produced volume. Bids and lot sizes use live sales rules, so the realised share can be lower. When electricity max 1.5x changes a local-sale margin, its value is shown on a second line in the same margin column; electricity bought above 1.5 times its initial local price is supplied externally at that cap, without changing runtime market rules. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first output minute with a non-positive margin, so a later recovery remains possible. Setup cost includes land, Construction Materials, Industrial Machines, and each distinct recipe-unlock research cost. Construction demand consumes the participating facilities' total Construction Materials and Industrial Machines requirement evenly through the 180-minute scenario; it is external demand, not a player expense. A scenario that stalls a facility is treated as an invalid report scenario.

| chain | primary output | facilities | setup cost (EUR) | market input cost (EUR) | staff wages 180m | margin 15m/60m/180m | window till unprofitable | facility payback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Staples: utilities -> Farm | Grain, Sugar | Small Utility Works x2, Farm x2 | 2028.00 | 3559.20 | 720.00 | 12.22/7.17/3.38<br>Generated orders max 25%: 3.56/1.51/-2.09 | 176 | not reached |
| Extraction: utilities -> Mine | Coal, Iron, Copper | Small Utility Works x2, Mine x3 | 3647.50 | 4476.30 | 3060.00 | 27.38/9.69/-1.17<br>Generated orders max 25%: 10.50/1.90/-7.78 | 46 | not reached |
| Fertilizer bridge: quarry -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2 | 11152.00 | 1892.46 | 3780.00 | 38.82/34.45/25.55<br>Generated orders max 25%: 30.15/28.79/20.08 | 134 | 492 |
| Fertilizer bridge: market inputs -> Grain and Sugar | Grain, Sugar | Small Utility Works x2, Chemical Plant x1, Farm x2 | 6205.00 | 2326.47 | 1980.00 | 32.43/24.95/16.99<br>Generated orders max 25%: 23.76/19.29/11.52 | 276 | 465 |
| Fertilizer: quarry -> Fertilizer | Fertilizer | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 10436.00 | 135.15 | 3420.00 | 34.01/27.21/17.27<br>Generated orders max 25%: 24.03/24.70/14.23 | 88 | not reached |
| Plastic: quarry -> Plastic | Plastic | Small Utility Works x2, Quarry x1, Chemical Plant x2 | 10433.00 | 283.39 | 3420.00 | 34.21/29.06/19.61<br>Generated orders max 25%: 22.09/25.89/15.28 | 58 | 848 |
| Steel: mines -> Steel | Steel | Small Utility Works x2, Mine x2, Industrial Processing Factory x1 | 4716.00 | 2597.11 | 3240.00 | 51.77/30.78/14.40<br>Generated orders max 25%: 40.13/27.96/11.30 | 118 | not reached |
| Poultry -> Cake | Cake | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 13016.00 | 2012.82 | 4320.00 | 85.32/71.70/47.84<br>Generated orders max 25%: 72.15/66.94/44.59 | 134 | 274 |
| Cattle -> Meat Pie | Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x1, Animal Farm x1, Bakery x1 | 13022.00 | 3250.04 | 4320.00 | 81.14/62.62/38.55<br>Generated orders max 25%: 66.11/56.30/34.70 | 1 | 469 |
| Animal farm and bakery: inputs -> Cake and Meat Pie | Cake, Meat Pie | Small Utility Works x2, Quarry x1, Chemical Plant x2, Farm x2, Animal Farm x3, Bakery x3 | 17888.50 | 3533.24 | 5940.00 | 92.48/110.27/67.74<br>Generated orders max 25%: 59.47/95.53/59.41 | 134 | 243 |
| Construction: inputs -> Construction Materials | Construction Materials | Water Well x1, Coal Power Plant x1, Mine x2, Quarry x3, Industrial Processing Factory x1, Construction Factory x4 | 24449.00 | 5836.05 | 12060.00 | 189.90/112.76/58.00<br>Generated orders max 25%: 172.34/95.03/49.58 | 1 | not reached |
| Industrial Machines: inputs -> Industrial Machines | Industrial Machines | Water Well x1, Coal Power Plant x1, Quarry x2, Chemical Plant x2, Mine x4, Electronics Factory x2, Industrial Processing Factory x2, Assembly Plant x1 | 39945.00 | 12929.50 | 15480.00 | 599.66/270.83/-29.40<br>Electricity max 1.5x: 599.73/270.87/-29.30<br>Generated orders max 25%: 455.46/210.28/-67.68 | 1 | 172 |
| Construction Materials: market inputs -> Construction Materials | Construction Materials | Water Well x1, Coal Power Plant x1, Construction Factory x1 | 10645.00 | 2794.59 | 3240.00 | 4.63/-3.56/-10.25<br>Generated orders max 25%: -5.18/-3.07/-11.10 | 1 | not reached |
| Industrial Machines: market inputs -> Industrial Machines | Industrial Machines | Water Well x1, Coal Power Plant x1, Assembly Plant x1 | 14489.00 | 19413.11 | 3960.00 | 149.54/91.47/53.92<br>Generated orders max 25%: 67.48/50.42/20.92 | 1 | not reached |

