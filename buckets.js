// The three reels. Every real movie in movies.js is sorted into one option per reel
// (see tools/build_movies.py for the sorting rules). The extra fields on each option
// are only used to write the parody pitch.

const HER = [
  { id: "exec", label: "A Big-City Executive", a: "a big-city executive", puns: ["Merger", "Bottom Line", "Promotion"], goal: "is one signature away from making partner", thing: "a color-coded planner" },
  { id: "lawyer", label: "A Lawyer", a: "a lawyer", puns: ["Verdict", "Objection", "Closing Argument"], goal: "has never lost a case or taken a day off", thing: "a briefcase she never puts down" },
  { id: "writer", label: "A Writer, Reporter or TV Host", a: "a journalist", puns: ["Deadline", "Headline", "Cover Story"], goal: "needs one perfect holiday story to save her career", thing: "a tiny notebook" },
  { id: "baker", label: "A Baker or Chef", a: "a pastry chef", puns: ["Sugar", "Frosting", "Gingerbread"], goal: "is about to open her own bakery", thing: "a sourdough starter named Gary" },
  { id: "planner", label: "An Event or Wedding Planner", a: "an event planner", puns: ["Gala", "RSVP", "Save the Date"], goal: "has planned 200 weddings and none of them hers", thing: "seven clipboards" },
  { id: "designer", label: "A Designer or Decorator", a: "an interior designer", puns: ["Deck the Halls", "Makeover", "Tinsel"], goal: "is up for the design job of a lifetime", thing: "a fabric swatch book" },
  { id: "artist", label: "An Artist or Photographer", a: "a struggling painter", puns: ["Portrait", "Canvas", "Snapshot"], goal: "has her first gallery show on Christmas Eve", thing: "a paint-splattered scarf" },
  { id: "performer", label: "A Singer, Actress or Dancer", a: "a famous singer", puns: ["Encore", "Carol", "Spotlight"], goal: "has forgotten why she loved music in the first place", thing: "enormous sunglasses" },
  { id: "teacher", label: "A Teacher or Professor", a: "a schoolteacher", puns: ["Lesson", "Recess", "Extra Credit"], goal: "is directing the school Christmas pageant alone", thing: "a tote bag of ungraded papers" },
  { id: "medic", label: "A Doctor, Nurse or Vet", a: "a doctor", puns: ["Heart", "Prescription", "House Call"], goal: "is on track to be chief of surgery", thing: "a pager she refuses to give up" },
  { id: "shop", label: "A Small-Business Owner", a: "a shop owner", puns: ["Shop", "Open House", "Window"], goal: "is fighting off a big-box competitor", thing: "a glue gun" },
  { id: "royal", label: "A Princess (or About to Be)", a: "a princess in disguise", puns: ["Crown", "Royal", "Tiara"], goal: "has three weeks before her arranged engagement", thing: "a tiara hidden in her luggage" },
  { id: "realty", label: "A Realtor or Architect", a: "a real estate developer", puns: ["Listing", "Blueprint", "Open House"], goal: "plans to turn a beloved landmark into condos", thing: "blueprints" },
  { id: "service", label: "A Soldier, Cop or Pilot", a: "an Army captain", puns: ["Homecoming", "Mission", "Salute"], goal: "has been ordered to take her first leave in six years", thing: "a duffel bag" },
  { id: "helper", label: "A Nanny or Assistant", a: "an overworked assistant", puns: ["Favor", "Errand", "Wish List"], goal: "does her boss's entire job for him", thing: "two phones" },
  { id: "other", label: "Something Oddly Specific", a: "a professional snow globe appraiser", puns: ["Snow Globe", "Ornament", "Wish"], goal: "is the best in a field nobody knew existed", thing: "a very specific toolkit" },
];

const PLACE = [
  { id: "hometown", label: "Back in Her Hometown", spots: [
    { n: "Evergreen Falls", at: "back in Evergreen Falls, the hometown she swore she'd never return to" },
    { n: "Holly Ridge", at: "back in Holly Ridge, where her childhood bedroom has not been touched" },
    { n: "Hartwell Springs", at: "home in Hartwell Springs, where everyone still calls her by her high school nickname" },
  ] },
  { id: "smalltown", label: "Stuck in a Small Town", spots: [
    { n: "Snowfall", at: "stranded in Snowfall, a town with one stoplight and nine festivals" },
    { n: "Mistletoe Junction", at: "stuck in Mistletoe Junction, where the only mechanic is on vacation until the 26th" },
    { n: "Peppermint Hollow", at: "in Peppermint Hollow, a town that takes Christmas extremely personally" },
  ] },
  { id: "city", label: "In the Big City", spots: [
    { n: "Manhattan", at: "in a Manhattan where it is always snowing gently and parking is easy" },
    { n: "Chicago", at: "in Chicago, in an apartment no one with her job could afford" },
    { n: "Seattle", at: "in Seattle, which is played by Vancouver" },
  ] },
  { id: "kingdom", label: "In a Tiny European Kingdom", spots: [
    { n: "Belmoravia", at: "in the kingdom of Belmoravia, a country roughly the size of a mall" },
    { n: "Galdovia", at: "in Galdovia, where everyone has a different British accent" },
    { n: "Valdoria", at: "in Valdoria, whose entire economy appears to be Christmas balls" },
  ] },
  { id: "europe", label: "Abroad, Somewhere With Castles", spots: [
    { n: "Scotland", at: "in Scotland, staring at a castle she may have inherited" },
    { n: "Vienna", at: "in Vienna, which she mispronounces for the entire first act" },
    { n: "Ireland", at: "in a village in Ireland where everyone knew her grandmother" },
  ] },
  { id: "inn", label: "At an Inn, Lodge or Resort", spots: [
    { n: "the Juniper Inn", at: "at the Juniper Inn, which has exactly one room left" },
    { n: "Pinecrest Lodge", at: "snowed in at Pinecrest Lodge with a fireplace the size of a car" },
    { n: "the Silver Spruce", at: "at the Silver Spruce, an inn three weeks from foreclosure" },
  ] },
  { id: "farm", label: "On a Farm, Ranch or Vineyard", spots: [
    { n: "Hollyhock Farm", at: "on Hollyhock Farm, in boots that cost more than the tractor" },
    { n: "Blitzen Ranch", at: "at Blitzen Ranch, face to face with a horse that hates her" },
    { n: "Snowberry Vineyard", at: "at Snowberry Vineyard, which one bad harvest could finish off" },
  ] },
  { id: "landmark", label: "At a Famous Tourist Attraction", spots: [
    { n: "Jollywood", at: "at Jollywood, in what is definitely not a 90-minute commercial" },
    { n: "the Grand Excelsior", at: "at the Grand Excelsior Hotel, lovingly shot from every angle" },
    { n: "FunWorld", at: "at FunWorld, whose logo is in every single frame" },
  ] },
  { id: "other", label: "Somewhere Unexpected", spots: [
    { n: "Alaska", at: "in rural Alaska, with a moose problem" },
    { n: "the North Pole", at: "at the actual North Pole, which has a zoning board" },
    { n: "the Yuletide Express", at: "on a cross-country train that is in no hurry" },
  ] },
];

const HIM = [
  { id: "royal", label: "A Prince in Disguise", a: "a prince in disguise", puns: ["Royal", "Crown", "Prince"], trait: "says he's 'in shipping'", secret: "is the heir to the throne" },
  { id: "builder", label: "A Carpenter or Handyman", a: "a widowed carpenter", puns: ["Workshop", "Handmade", "Fixer-Upper"], trait: "builds rocking chairs and also emotional walls", secret: "carved the town's nativity scene by hand" },
  { id: "farmer", label: "A Farmer or Rancher", a: "a Christmas tree farmer", puns: ["Evergreen", "Pine", "Sleigh"], trait: "can tell a tree's age by smelling it", secret: "used to be a Wall Street banker" },
  { id: "host", label: "An Innkeeper or Shop Owner", a: "an innkeeper", puns: ["Inn", "No Vacancy", "Welcome Home"], trait: "makes legendary hot cocoa", secret: "is about to lose the place to the bank" },
  { id: "chef", label: "A Chef or Baker", a: "a small-town chef", puns: ["Recipe", "Cocoa", "Cookie"], trait: "has flour on his face at all times", secret: "trained in Paris" },
  { id: "hero", label: "A Firefighter, Cop or Soldier", a: "a firefighter", puns: ["Spark", "Fireside", "Rescue"], trait: "rescues cats from trees at least twice a week", secret: "is also the volunteer Santa" },
  { id: "medic", label: "A Doctor or Vet", a: "a small-town veterinarian", puns: ["Reindeer", "Paws", "Heartbeat"], trait: "is nursing an injured reindeer back to health", secret: "turned down a job at a famous hospital" },
  { id: "teacher", label: "A Teacher or Professor", a: "a music teacher", puns: ["Choir", "Harmony", "Lesson"], trait: "is rehearsing the children's choir", secret: "wrote a hit song years ago under a fake name" },
  { id: "athlete", label: "An Athlete or Coach", a: "a retired hockey player", puns: ["Ice", "Rink", "Overtime"], trait: "coaches the underdog peewee team", secret: "played one season in the pros" },
  { id: "suit", label: "A Businessman in a Nice Coat", a: "a rival executive", puns: ["Merger", "Deal", "Bonus"], trait: "has never decorated a tree in his life", secret: "bought the company to save it" },
  { id: "writer", label: "A Writer or Reporter", a: "a travel writer", puns: ["Chapter", "Story", "Byline"], trait: "is writing an article he won't let her read", secret: "is the author of her favorite book" },
  { id: "artist", label: "A Musician, Actor or Artist", a: "a famous actor hiding out", puns: ["Encore", "Spotlight", "Ballad"], trait: "wears a baseball cap as a disguise and it works", secret: "just wants a normal Christmas" },
  { id: "lawyer", label: "A Lawyer or Mayor", a: "the town's young mayor", puns: ["Town Hall", "Main Street", "Motion"], trait: "knows every resident by name", secret: "never wanted the job" },
  { id: "santa", label: "Santa, an Angel or a Ghost", a: "a man who may literally be Santa's son", puns: ["Santa", "Sleigh Bell", "Naughty or Nice"], trait: "is suspiciously good at guessing what people want", secret: "has a very nice, un-bearded face" },
  { id: "dad", label: "A Single Dad (Job Unclear)", a: "a single dad with no visible job", puns: ["Family", "Home", "Snow Day"], trait: "has a precocious 8-year-old who plays matchmaker", secret: "hasn't decorated since his wife passed" },
  { id: "other", label: "Something Oddly Specific", a: "a third-generation ornament polisher", puns: ["Ornament", "Sparkle", "Snowflake"], trait: "is the last man alive who knows how to do his job", secret: "made her favorite childhood ornament" },
];

const EVENTS = [
  "the Winter Lantern Festival", "the Annual Gingerbread Showdown", "the Christmas Eve Sleigh Parade",
  "the Candy Cane Ball", "the Tree Lighting Ceremony", "the Holiday Bake-Off", "the Snow Sculpture Contest",
  "the Christmas Market", "the Royal Christmas Ball", "the children's Christmas pageant",
];
const LANDMARKS = [
  "the old covered bridge", "the town square gazebo", "the community center", "the family inn",
  "the cookie factory", "the ice rink", "the bookstore", "the 100-year-old town tree",
];

const HEROINE_NAMES = ["Holly", "Noelle", "Carol", "Ivy", "Kristen", "Emily", "Hope", "Joy", "Claire", "Natalie", "Merry", "Gwen", "Abby", "Jenna", "Lacey", "Sarah", "Belle", "Paige"];
const HERO_NAMES = ["Nick", "Jack", "Luke", "Cole", "Ben", "Wyatt", "Chris", "Dean", "Jesse", "Ryan", "Grant", "Mason", "Sam", "Tyler", "Kris", "Owen", "Beau", "Hunter"];
const RIVALS = ["Chad", "Preston", "Brock", "Spencer", "Trevor", "Thad", "Blake"];

const INCITING = [
  "her boss sends her out of town to close a deal",
  "an estranged aunt leaves her a failing inn",
  "her flight is grounded by a 'freak' snowstorm",
  "her GPS dies on a back road",
  "she inherits a mysterious snow globe",
  "her sister begs her to come for the holidays",
  "a viral video makes her the least popular person in town",
  "she's assigned to write an exposé about the place",
  "her car slides gently into a snowbank",
];

const CLIMAXES = [
  "she gets the big promotion and turns it down",
  "she misses her flight on purpose",
  "her big-city fiancé, {rival}, shows up in a very wrong coat",
  "the whole town comes together to save {landmark}",
  "it starts snowing exactly as they almost kiss",
  "an elderly local with suspiciously twinkly eyes gives her one piece of advice",
  "she realizes the real story was here all along",
  "{hero} reveals that he {secret}",
];

const TITLE_TEMPLATES = [
  "A {town} Christmas", "Christmas in {town}", "{herPun} for the Holidays", "A {herPun} Christmas",
  "{heroPun} & {herPun}", "My {heroPun} Holiday", "Christmas {herPun}", "The {herPun} of Christmas",
  "Home for the Holidays in {town}", "{heroPun} All the Way", "A Very {heroPun} Christmas",
  "The Christmas {herPun}", "Merry {heroPun}", "Falling for {town}", "Mistletoe & {herPun}",
  "Twelve Days of {herPun}", "A {heroPun} for Christmas", "Christmas at {town}",
];

// Plain-English labels for the tropes tagged on real movies (used in the stats).
const TROPE_LABELS = {
  returns_home: "She goes back to her hometown",
  big_city_to_small_town: "Big-city woman, small town",
  single_parent: "Somebody is a single parent",
  widowed: "Somebody is widowed",
  royalty: "Royalty is involved",
  secret_identity: "Somebody hides who they are",
  fake_relationship: "They pretend to be a couple",
  exes_reunited: "They used to date",
  childhood_friends: "They grew up together",
  work_rivals: "They are rivals at work",
  snowed_in_or_stranded: "Snowed in or stranded",
  save_the_business: "A business must be saved",
  inheritance: "She inherits something",
  magic_or_santa: "Actual magic or actual Santa",
  time_travel_or_wish: "Time travel or a wish",
  amnesia: "Amnesia",
  competition_or_contest: "There is a contest",
  wedding: "There is a wedding",
  promotion_at_stake: "A promotion is on the line",
  boss_or_client_romance: "He is her boss or client",
  sequel: "It is a sequel",
};

// Parts for the made-up titles in the Real or Fake? game.
const FAKE_ADJ = ["Gingerbread", "Mistletoe", "Snowflake", "Candy Cane", "Sugar Plum", "Evergreen", "Starlight", "Holly", "Peppermint", "Jingle Bell", "Royal", "Cozy", "Merry", "Winter", "Homemade", "Frosted"];
const FAKE_THING = ["Wish", "Promise", "Miracle", "Kiss", "Waltz", "Surprise", "Homecoming", "Reunion", "Proposal", "Secret", "Contract", "Inn", "Cottage", "Parade", "Cookie", "Carol", "Bride", "Prince", "Castle", "Getaway", "Makeover", "Bake-Off", "Merger", "Sleigh Ride"];
const FAKE_PLACE = ["Snowfall", "Evergreen Falls", "Holly Ridge", "Pinecrest Lodge", "Mistletoe Junction", "the Juniper Inn", "Peppermint Hollow", "Starlight Harbor", "Belmoravia", "Candy Cane Lane", "Reindeer Ranch", "Cranberry Cove"];
const FAKE_TEMPLATES = [
  "The Christmas {thing}", "A {adj} Christmas", "Christmas at {place}", "A Christmas {thing}",
  "Christmas in {place}", "{thing} Under the Mistletoe", "A {adj} {thing}", "The {adj} {thing}",
  "My Christmas {thing}", "A {adj} Christmas {thing}", "{adj} {thing} for Christmas", "A {place} Christmas",
];
