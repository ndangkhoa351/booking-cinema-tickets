const { promisify } = require("util");
const express = require("express");
const rename = promisify(require("fs").rename);
const FilmRepo = require("../../../repositories/Film/FilmRepo");

const CinemaClusterRepo = require("../../../repositories/CinemaCluster/CinemaClusterRepo");
const multer = require("multer");
let FILM_ID_CHOOSEN;
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const middleware = require("../../../middlewares/authenticationAdmin");
//////
const CinemaClusRepo = require("../../../repositories/CinemaCluster/CinemaClusterRepo");
/////

router.use(middleware);

router.get("/", (req, res) => {
  FILM_ID_CHOOSEN = req.query.filmID;
  const action = req.query.action;

  if (action == "delete") {
    FilmRepo.delete(FILM_ID_CHOOSEN)
      .then((result) => {
        res.redirect("/admin/manage-film");
      })
      .catch((err) => {
        res.render("error/error");
      });
  }
  // none of above - default.
  else {
    FilmRepo.getAll()
      .then((films) => {
        res.render("Film/admin/manage-film", { films ,layout: 'dashboard/layout'});
      })
      .catch((err) => {
        res.render("error/error");
      });
  }
});

// ------------------------ Add Film ------------------------
router.get("/add-film", (req, res) => {
  FilmRepo.getAll()
      .then((films) => {
        res.render("Film/admin/add-film" , {films, layout: 'dashboard/layout'});
      })
      .catch((err) => {
        res.render("error/error");
      });
  
});

router.get("/report", (req, res) => {
  res.render("Film/admin/report" , {layout: 'dashboard/layout'});
});
router.get("/report-film", (req, res) => {
  res.locals.fromDate=req.body.fromDate;
  res.locals.toDate=req.body.toDate;
  res.render("Film/admin/report-film" , {layout: 'dashboard/layout'});
});
router.post("/report",async (req,res)=>{
  res.locals.fromDate=req.body.fromDate;
  res.locals.toDate=req.body.toDate;
  const fromDate = Date(req.body.fromDate);
  const toDate = Date(req.body.toDate);
  FilmRepo.report(req.body.fromDate,req.body.toDate)
  .then((reportFilms) => {
    CinemaClusterRepo.report(req.body.fromDate,req.body.toDate)
     .then ((reportCinemaClus)=>{
      res.render("Film/admin/report-film" , {reportFilms,reportCinemaClus, layout: 'dashboard/layout'});
     })
  })
  .catch((err) => {
    res.render("error/error");
  });
});

router.post("/add-film", upload.single("film_poster"), async (req, res) => {
  const { film_name, film_pdate,film_overview,film_trailer, film_time } = req.body;

  const oNewFilm = {
    displayName: film_name,
    publishDate: film_pdate,
    overview: film_overview,
    trailer: film_trailer,
    time: film_time,
    poster: req.file.buffer,
  };

  FilmRepo.add(oNewFilm)
    .then((result) => {
      res.status(200).redirect("/admin/manage-film");
    })
    .catch((err) => {
      res.status(500).render("error/error");
    });
});

// ------------------------ Update Film ------------------------
router.get("/update-film", (req, res) => {
  const FILM_ID_CHOOSEN = req.query.filmID;

  FilmRepo.getByID(FILM_ID_CHOOSEN)
    .then((filmMatch) => {
      res.render("Film/admin/update-film", { filmMatch, layout: 'dashboard/layout' });
    })
    .catch((err) => {
      res.render("error/error");
    });
});

router.post("/update-film", upload.single("film_poster"), async (req, res) => {
  const { film_uuid, film_name, film_pdate, film_time, film_poster,film_trailer,film_overview } = req.body;

  const imageFile = req.file ? req.file.buffer : film_poster;

  const oNewFilmUpdated = {
    uuid: film_uuid,
    overview: film_overview,
    trailer: film_trailer,
    displayName: film_name,
    publishDate: film_pdate,
    time: film_time,
    poster: imageFile,
  };

  FilmRepo.updateRecord(oNewFilmUpdated)
    .then((result) => {
      res.redirect("/admin/manage-film");
    })
    .catch((err) => {
      res.render("error/error");
    });
});

router.get("/poster/:id", (req, res) => {
  FilmRepo.getByID(req.params.id).then((film) => {
    if (!film || !film.poster) {
      res.status(404).send("File not found");
    } else {
      res.header("Content-Type", "image/jpeg").send(film.poster);
    }
  });
});

router.get("/avatarCinemaClus/:id", (req, res) => {
  CinemaClusRepo.getByID(req.params.id).then((cinema) => {
    if (!cinema || !cinema.avatar) {
      res.status(404).send("File not found");
    } else {
      res.header("Content-Type", "image/jpeg").send(cinema.avatar);
    }
  });
});

module.exports = router;
