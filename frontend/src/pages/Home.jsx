import React from "react";
import bgImage from "../assets/bginfosys.png";
import heroImg from "../assets/heroimg.png";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section
      className="vh-100 d-flex align-items-center text-dark"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1682256781111-9d20db9ca5a0?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmFja2dyb3VuZCUyMG1hdHJpeHxlbnwwfHwwfHx8MA%3D%3D")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Gradient Overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0.7))",
        }}
      ></div>

      <div className="container position-relative">
        <div className="row align-items-center h-100">
          {/* Left Section */}
          <div className="col-lg-6 text-start animate__animated animate__fadeInLeft">
            <small className="text-uppercase fw-semibold text-primary mb-2 d-block">
              Discover | Connect | Experience
            </small>
            <h1 className="display-2 fw-bold mb-4 lh-sm">
              Your Gateway <br />
              <span className="text-gradient">to Every College Event</span>
            </h1>
            <p className="fs-5 text-muted mb-4">
              From <strong>tech fests</strong> to <strong>cultural nights</strong>, 
              <em>competitions</em> to <em>workshops</em> — stay updated and never 
              miss out on what’s happening around you.
            </p>
            <div className="d-flex gap-3">
              <Link
                to="/events"
                className="btn btn-primary btn-lg px-4 shadow-sm"
              >
                <i className="fas fa-calendar-check me-2"></i> Explore Events
              </Link>
              
            </div>
          </div>

          {/* Right Section */}
          <div className="col-lg-6 text-center mt-5 mt-lg-0 animate__animated animate__fadeInRight">
            <img
              src={heroImg}
              alt="Hero Illustration"
              className="img-fluid rounded-4 shadow-lg"
              style={{ maxHeight: "500px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
