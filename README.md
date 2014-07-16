OrderZapp-ServerApp
=====================
UD001-Account status is deactive


////WORKORDER CODE/////
AW001-No workorder exists



////user=====
AL001-PLEASE LOGI TO CONTINUE

db.users.aggregate([{$match:{areaofexpertise:{$in:[1,4]}}},{$unwind:"$round_robin"},{$group:{_id:"$round_robin",count:{$max:"$round_robin.count"}}}]);


//find and
db.users.aggregate([{$match:{areaofexpertise:{$in:[1,4]}}},{$unwind:"$round_robin"},{$group:{_id:"$round_robin.categoryid",count:{$max:"$round_robin.count"}}}]);
{
	"result" : [
		{
			"_id" : 4,
			"count" : 7
		},
		{
			"_id" : 1,
			"count" : 15
		}
	],
	"ok" : 1
}

ERROR CODEL
AS001-








///////////////////
A finish carpenter works on joints. Finish carpentry is for cabinetry, instrument making, and furniture. Like most carpentry, precision is vital.
A cabinetmaker specializes in making detailed dressers, chests, and other furniture used for storing things.
A ship’s carpenter hones his skills on repairing nautical needs. Ship’s carpenters work on shipbuilding and maintenance.
A scenic carpenter builds things for TV, theatres, films, and other temporary scenery for sets.
A framer builds the framework for buildings.
A luthier specializes in repairing stringed instruments or making instruments.
A formwork carpenter works with shuttering and falsework used in concrete construction.
A trim carpenter specializes in moulding and trims for mantels and window casings.
Green carpentry is a type of carpentry that only uses energy-efficient sources for construction.
Each type of carpentry comes with its own set of advantages and disadvantages. As to be expected, certain carpenters will make more than others depending on their skill and talent.