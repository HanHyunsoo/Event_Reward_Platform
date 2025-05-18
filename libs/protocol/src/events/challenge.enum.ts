export enum ChallengeType {
  누적_로그인_횟수 = 'continuousLoginCount',
  복귀_유저 = 'returnUser',
  캐시_소유_이상 = 'cashGreaterThanOrEqual',
  캐시_소유_이하 = 'cashLessThanOrEqual',
  코인_소유_이상 = 'coinGreaterThanOrEqual',
  코인_소유_이하 = 'coinLessThanOrEqual',
  모든_아이템_소유_개수 = 'allItemCount',
  특정_아이템_소유_개수 = 'specificItemCount',
}
